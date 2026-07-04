package com.synbiohub.sbh3.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.synbiohub.sbh3.security.model.AuthCodes;
import com.synbiohub.sbh3.security.repo.AuthRepository;
import com.synbiohub.sbh3.sparql.SPARQLQuery;
import com.synbiohub.sbh3.submit.SubmitPayload;
import com.synbiohub.sbh3.submit.SubmitPluginService;
import com.synbiohub.sbh3.submit.SubmitRootCollectionMetadata;
import com.synbiohub.sbh3.utils.ConfigUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.io.FilenameUtils;
import org.apache.hc.client5.http.auth.AuthScope;
import org.apache.hc.client5.http.auth.UsernamePasswordCredentials;
import org.apache.hc.client5.http.classic.methods.HttpPost;
import org.apache.hc.client5.http.impl.auth.BasicCredentialsProvider;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.http.ContentType;
import org.apache.hc.core5.http.io.entity.ByteArrayEntity;
import org.sbolstandard.core2.*;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.synbiohub.frontend.SynBioHubException;
import org.synbiohub.frontend.SynBioHubFrontend;

import javax.xml.namespace.QName;
import java.io.*;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;
import java.util.zip.GZIPOutputStream;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;

/**
 * Orchestrates {@code POST /submit}: multipart form → Virtuoso graph upload.
 * <p>
 * Pipeline (legacy {@code lib/views/submit.js} + {@code PrepareSubmissionJob}):
 * <pre>
 *   parse → sanitize → submit plugin → readSbol → prepare → upload
 * </pre>
 * State is carried in a single mutable {@link SubmitPayload}.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SubmitServiceImpl implements SubmitService {

    private final UserService userService;
    private final AuthRepository authRepository;
    private final SearchService searchService;
    private final SubmitPluginService submitPluginService;
    private final CitationService citationService;

    /**
     * Main submit entry point. Each step mutates {@code payload} in place.
     */
    @Override
    public ResponseEntity<String> submit(SubmitPayload allParams, MultipartFile file) throws IOException, SBOLValidationException {
        SubmitPayload payload = parse(allParams, file);
        sanitize(payload);
        submitPluginService.applySubmitPlugin(payload); // optional transform of uploaded file
        readSbol(payload);
        prepare(payload);  // only runs for overwrite_merge == 1
        upload(payload);
        return successResponse();
    }

    // -------------------------------------------------------------------------
    // parse — multipart form fields + temp file + authenticated user context
    // -------------------------------------------------------------------------

    /**
     * Reads form parameters and persists the uploaded file to a temp path.
     * Does not validate business rules (that is {@link #sanitize}).
     */
    private SubmitPayload parse(SubmitPayload payload, MultipartFile file) throws IOException {
        //TODO: why are we creating a temp file here?
        if (file != null && !file.isEmpty()) {
            String suffix = sanitizeFilename(file.getOriginalFilename());
            Path temp = Files.createTempFile("sbh-submit-", "-" + suffix);
            file.transferTo(temp);
            payload.setUploadedFilePath(temp.toAbsolutePath().toString());
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        payload.setCreatedBy(auth.getName());
        return payload;
    }

    // -------------------------------------------------------------------------
    // sanitize — resolve collection URI, check existence, enforce overwrite_merge
    // -------------------------------------------------------------------------

    /**
     * Two submission modes:
     * <ul>
     *   <li><b>New collection</b> — form {@code id} (+ optional {@code version}); {@code collectionUri} is computed.</li>
     *   <li><b>Existing collection</b> — form {@code rootCollections} is the target identity URI; defaults to merge mode 2.</li>
     * </ul>
     * {@code overwrite_merge} modes (legacy submit form):
     * 0 = new version, 1 = overwrite in place, 2 = merge, 3 = merge and replace remote duplicates.
     */
    private void sanitize(SubmitPayload payload) throws IOException {
        boolean submittingToExisting = payload.getCollectionUri() != null && payload.getId() == null;
        boolean creatingNew = payload.getId() != null;

        if (!submittingToExisting && !creatingNew) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Provide either rootCollections (existing collection) or id (new collection).");
        }

        if (submittingToExisting) {
            if (payload.getOverwriteMerge() == null) {
                payload.setOverwriteMerge("2");
            }
            if (payload.getUploadedFilePath() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "file is required when submitting into an existing collection.");
            }
        } else {
            resolveNewCollectionUri(payload);
        }

        payload.setCitationPubmedIds(citationService.parseCitationPubmedIds(payload.getCitations()));

        String graphUri = graphUriForCollection(payload.getCollectionUri(), payload);
        boolean metadataExists = collectionExists(payload.getCollectionUri(), graphUri);
        payload.setExistingCollection(metadataExists
                ? loadExistingCollection(payload.getCollectionUri(), graphUri)
                : null);

        applyCollectionExistenceRules(payload, metadataExists, creatingNew);
    }

    /**
     * Resolves {@link SubmitPayload#getCollectionUri()} for a new collection from {@code id} and {@code version}.
     */
    private void resolveNewCollectionUri(SubmitPayload payload) {
        if (!COLLECTION_ID_PATTERN.matcher(payload.getId()).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "id must contain only alphanumeric characters and underscores.");
        }
        if (payload.getVersion() == null) {
            payload.setVersion("1");
        }
        payload.setCollectionUri(
                uriPrefix(payload) + payload.collectionDisplayId() + "/" + payload.getVersion());
    }

    /**
     * Legacy submit rules after collection metadata presence is known.
     * <p>
     * If metadata is missing, merge modes 2/3 are rejected. If metadata exists and mode is 0,
     * the submission is rejected (id+version already taken). Modes 2/3 copy name/description
     * from the store into the payload.
     */
    private void applyCollectionExistenceRules(SubmitPayload payload, boolean metadataExists,
                                               boolean creatingNew) {
        if (!metadataExists) {
            if (payload.getOverwriteMerge() != null) {
                int mode = parseOverwriteMerge(payload.getOverwriteMerge());
                if (mode == 2 || mode == 3) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Submission id and version do not exist");
                }
            }
            payload.setOverwriteMerge("0");
            if (creatingNew) {
                requireNonBlank(payload.getName(), "name");
                requireNonBlank(payload.getDescription(), "description");
            }
            return;
        }

        int mode = parseOverwriteMerge(
                payload.getOverwriteMerge() != null ? payload.getOverwriteMerge() : "0");

        if (mode == 2 || mode == 3) {
            fillPayloadFromExistingCollection(payload);
            return;
        }
        if (mode == 1) {
            return;
        }
        throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Submission id and version already in use");
    }

    /** Copies stored collection metadata into the payload when merging (modes 2/3). */
    private void fillPayloadFromExistingCollection(SubmitPayload payload) {
        SubmitRootCollectionMetadata existing = payload.getExistingCollection();
        if (existing == null) {
            return;
        }
        if (existing.getName() != null) {
            payload.setName(existing.getName());
        }
        if (existing.getDescription() != null) {
            payload.setDescription(existing.getDescription());
        }
        if (existing.getVersion() != null) {
            payload.setVersion(existing.getVersion());
        }
        if (existing.getDisplayId() != null) {
            String displayId = existing.getDisplayId();
            if (displayId.endsWith("_collection")) {
                payload.setId(displayId.substring(0, displayId.length() - "_collection".length()));
            }
        }
    }

    private boolean collectionExists(String collectionUri, String graphUri) throws IOException {
        String query = "ASK { <" + collectionUri + "> a <http://sbols.org/v2#Collection> . }";
        return sparqlAsk(query, graphUri);
    }

    private SubmitRootCollectionMetadata loadExistingCollection(String collectionUri, String graphUri)
            throws IOException {
        String sparql = searchService.getTopLevelMetadataSPARQL(collectionUri);
        String raw = searchService.SPARQLQuery(sparql, graphUri);
        JsonNode bindings = JSON.readTree(raw).path("results").path("bindings");
        if (!bindings.isArray() || bindings.isEmpty()) {
            return SubmitRootCollectionMetadata.builder().build();
        }
        JsonNode row = bindings.get(0);
        return SubmitRootCollectionMetadata.builder()
                .name(textValue(row, "name"))
                .description(textValue(row, "description"))
                .displayId(textValue(row, "displayId"))
                .version(textValue(row, "version"))
                .build();
    }

    private boolean sparqlAsk(String query, String graphUri) throws IOException {
        String raw = searchService.SPARQLQuery(query, graphUri);
        return JSON.readTree(raw).path("boolean").asBoolean(false);
    }

    /**
     * Public collections live in {@code defaultGraph}; private user collections use the
     * submitter's named graph URI.
     */
    private String graphUriForCollection(String collectionUri, SubmitPayload payload) throws IOException {
        String publicGraph = ConfigUtil.get("defaultGraph").asText();
        if (collectionUri.startsWith(publicGraph) || collectionUri.contains("/public/")) {
            return publicGraph;
        }
        return userService.getUserByUsername(payload.getCreatedBy()).getGraphUri();
    }

    private static String textValue(JsonNode binding, String key) {
        JsonNode node = binding.path(key);
        return node.isMissingNode() || node.isNull() ? null : node.path("value").asText(null);
    }

    private static int parseOverwriteMerge(String raw) {
        try {
            return Integer.parseInt(raw.trim());
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid overwrite_merge: " + raw);
        }
    }

    private static void requireNonBlank(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " is required.");
        }
    }

    // -------------------------------------------------------------------------
    // readSbol — validate/convert input, build composite SBOLDocument (PrepareSubmissionJob)
    // -------------------------------------------------------------------------

    /**
     * SBOL preparation pipeline. Produces {@code payload.resultFilePath} (serialized XML).
     */
    private void readSbol(SubmitPayload payload) throws IOException, SBOLValidationException {
        setupReadSbol(payload);
        classifySubmitInput(payload);
        mergeValidatedSbolFiles(payload);
        prepareRootCollection(payload);
        mergeIntoExistingCollection(payload);   // modes 2/3 only
        fixMutableAnnotations(payload);
        populateCollectionMembership(payload);
        if (ConfigUtil.get("useSBOLExplorer").asBoolean(false)) {
            incrementallyUpdateSbolExplorer(payload);
        }
        finishReadSbol(payload);
    }

    /** Writes the composite document to a temp XML file ({@code resultFilename} in legacy Node). */
    private void finishReadSbol(SubmitPayload payload) throws IOException {
        Path resultFile = Files.createTempFile("sbh_convert_validate", ".xml");
        try {
            SBOLWriter.write(payload.getSbolDocument(), resultFile.toFile());
        } catch (SBOLConversionException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Failed to write SBOL output: " + e.getMessage());
        }
        payload.setResultFilePath(resultFile.toAbsolutePath().toString());

        long started = payload.getReadSbolStartedAtMs() != null
                ? payload.getReadSbolStartedAtMs()
                : System.currentTimeMillis();
        log.info("readSbol total time (sec): {}", (System.currentTimeMillis() - started) / 1000.0);
    }

    /** Notifies SBOL Explorer of added top-levels after a successful submit (when enabled). */
    private void incrementallyUpdateSbolExplorer(SubmitPayload payload) throws IOException {
        String graph = resolveOwnedByPrefix(payload);

        ObjectNode body = JSON.createObjectNode();
        body.set("partsToRemove", JSON.createArrayNode());
        ArrayNode partsToAdd = JSON.createArrayNode();
        for (TopLevel topLevel : payload.getSbolDocument().getTopLevels()) {
            ObjectNode part = JSON.createObjectNode();
            part.put("subject", topLevel.getIdentity().toString());
            part.put("displayId", topLevel.getDisplayId());
            part.put("version", topLevel.getVersion());
            part.put("name", topLevel.getName());
            part.put("description", topLevel.getDescription());
            part.put("type", "TODO");
            part.put("graph", graph);
            partsToAdd.add(part);
        }
        body.set("partsToAdd", partsToAdd);

        String endpoint = ConfigUtil.get("SBOLExplorerEndpoint").asText();
        if (!endpoint.endsWith("/")) {
            endpoint += "/";
        }
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        try {
            new RestTemplate().postForEntity(endpoint + "incrementalupdate",
                    new HttpEntity<>(body, headers), String.class);
        } catch (Exception e) {
            log.warn("SBOLExplorer /incrementalupdate failed", e);
        }
    }

    /**
     * Validates each SBOL input file, strips registry objects, rewrites URIs to the submission
     * prefix, and merges into the composite document on {@code payload}.
     */
    private void mergeValidatedSbolFiles(SubmitPayload payload) throws IOException {
        String databasePrefix = ConfigUtil.get("databasePrefix").asText();
        String uriPrefix = uriPrefix(payload);
        String version = payload.getVersion() != null ? payload.getVersion() : "1";

        boolean requireComplete = ConfigUtil.get("requireComplete").asBoolean(false);
        boolean requireCompliant = ConfigUtil.get("requireCompliant").asBoolean(false);
        boolean enforceBestPractices = ConfigUtil.get("requireBestPractice").asBoolean(false);
        List<String> registryPrefixes = new ArrayList<>(webOfRegistriesMap().keySet());

        StringBuilder readLog = new StringBuilder();
        SBOLDocument composite = payload.getSbolDocument();

        for (Path file : payload.getSbolFiles()) {
            String filename = file.toString();
            String defaultDisplayId = fixDisplayId(displayIdFromFilename(filename));

            ByteArrayOutputStream logOut = new ByteArrayOutputStream();
            ByteArrayOutputStream errorOut = new ByteArrayOutputStream();
            SBOLDocument individual = SBOLValidate.validate(
                    new PrintStream(logOut),
                    new PrintStream(errorOut),
                    filename,
                    "http://dummy.org/",
                    defaultDisplayId,
                    requireComplete,
                    requireCompliant,
                    enforceBestPractices,
                    false,
                    "1",
                    true,
                    "",
                    "",
                    filename,
                    "",
                    false,
                    false,
                    false,
                    false,
                    false,
                    null,
                    false,
                    true,
                    false);

            readLog.append("[").append(filename).append(" log] \n")
                    .append(logOut.toString(StandardCharsets.UTF_8)).append("\n");

            String errorLog = errorOut.toString(StandardCharsets.UTF_8);
            if (errorLog.startsWith("File is empty")) {
                // Empty Office/plugin placeholder — treat as blank document.
                individual = new SBOLDocument();
                errorLog = "";
            } else if (!errorLog.isEmpty()) {
                failReadSbol(readLog.toString(), errorLog);
            }

            // Registry URIs are removed from the document but remembered for collection membership.
            stripRegistryTopLevels(individual, registryPrefixes, payload);

            try {
                individual = rewriteIndividualUris(individual, uriPrefix, version, databasePrefix);
                composite.createCopy(individual);
            } catch (Exception e) {
                StringWriter sw = new StringWriter();
                e.printStackTrace(new PrintWriter(sw));
                failReadSbol(readLog.toString(), sw.toString());
            }
        }

        if (!readLog.isEmpty()) {
            log.debug("readSbol validate log:\n{}", readLog);
        }
    }

    /**
     * Creates or updates the root {@code Collection} and annotates every top-level with
     * ownedBy, topLevel, citations, and creator metadata.
     */
    private void prepareRootCollection(SubmitPayload payload) throws IOException, SBOLValidationException {
        SBOLDocument doc = payload.getSbolDocument();
        String version = payload.getVersion() != null ? payload.getVersion() : "1";
        String ownedByUri = resolveOwnedByPrefix(payload);

        String displayId = payload.collectionDisplayId();
        if (displayId == null) {
            return;
        }
        org.sbolstandard.core2.Collection root = doc.getCollection(displayId, version);
        if (root == null) {
            root = doc.createCollection(displayId, version);
            log.debug("New root collection: {}", root.getIdentity());
        }
        applySubmitRootCollection(payload, doc, root, ownedByUri);
    }

    /** Sets name, description, creator, citations, ownedBy, and topLevel on all identified objects. */
    private void applySubmitRootCollection(SubmitPayload payload, SBOLDocument doc,
                                           org.sbolstandard.core2.Collection root,
                                           String ownedByUri) {
        try {
            //TODO: Check creator is correct as full name
            String creator = userService.getUserByUsername(payload.getCreatedBy()).getName();
            if (creator != null) {
                root.createAnnotation(DC_CREATOR, creator);
            }
            root.createAnnotation(DCTERMS_CREATED,
                    ZonedDateTime.now().format(DateTimeFormatter.ISO_INSTANT));
            if (payload.getName() != null) {
                root.setName(payload.getName());
            }
            if (payload.getDescription() != null) {
                root.setDescription(payload.getDescription());
            }
            new IdentifiedVisitor() {
                @Override
                public void visit(Identified identified, TopLevel topLevel) {
                    try {
                        propagateTopLevelInNestedAnnotations(topLevel, identified.getAnnotations());
                        for (Integer pubmedId : payload.getCitationPubmedIds()) {
                            identified.createAnnotation(OBO_PUBMED, String.valueOf(pubmedId));
                        }
                        Annotation ownedBy = identified.getAnnotation(SBH_OWNED_BY);
                        if (ownedBy != null) {
                            identified.removeAnnotation(ownedBy);
                        }
                        identified.createAnnotation(SBH_OWNED_BY, new URI(ownedByUri));
                        Annotation topLevelAnn = identified.getAnnotation(SBH_TOP_LEVEL);
                        if (topLevelAnn != null) {
                            identified.removeAnnotation(topLevelAnn);
                        }
                        identified.createAnnotation(SBH_TOP_LEVEL, topLevel.getIdentity());
                    } catch (SBOLValidationException | URISyntaxException e) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                "Failed to annotate object: " + e.getMessage());
                    }
                }
            }.visitDocument(doc);
        } catch (SBOLValidationException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Failed to prepare root collection: " + e.getMessage());
        }
    }

    /**
     * Merge modes 2/3: for objects whose URIs already exist in a configured registry,
     * fetch from remote SynBioHub and either reject (different content), replace (mode 3),
     * or keep as collection members (identical content).
     */
    private void mergeIntoExistingCollection(SubmitPayload payload) throws IOException {
        String mode = payload.getOverwriteMerge();
        if (mode == null || "0".equals(mode) || "1".equals(mode)) {
            return;
        }

        SBOLDocument doc = payload.getSbolDocument();
        String rootCollectionIdentity = payload.getCollectionUri();
        String version = payload.getVersion() != null ? payload.getVersion() : "1";
        org.sbolstandard.core2.Collection rootCollection = null;
        if (payload.collectionDisplayId() != null) {
            rootCollection = doc.getCollection(payload.collectionDisplayId(), version);
        }

        String shareLinkSalt = ConfigUtil.get("shareLinkSalt").asText("");
        String authToken = resolveUserAuthToken(payload);
        Map<String, String> registries = webOfRegistriesMap();

        for (TopLevel topLevel : new ArrayList<>(doc.getTopLevels())) {
            String identity = topLevel.getIdentity().toString();

            if (rootCollectionIdentity != null && identity.equals(rootCollectionIdentity)) {
                // Existing collection metadata is preserved from the store during merge.
                stripExistingRootCollectionMetadata(topLevel);
                continue;
            }

            for (Map.Entry<String, String> entry : registries.entrySet()) {
                String registry = entry.getKey();
                if (!identity.startsWith(registry)) {
                    continue;
                }

                String fetchUri = registryFetchUri(identity, registry, shareLinkSalt);
                SynBioHubFrontend sbh = new SynBioHubFrontend(entry.getValue(), registry);
                if (authToken != null) {
                    sbh.setUser(authToken);
                }

                SBOLDocument remoteDoc;
                try {
                    remoteDoc = sbh.getSBOL(URI.create(fetchUri));
                } catch (SynBioHubException e) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
                }

                if (remoteDoc == null) {
                    break;
                }

                TopLevel remote = remoteDoc.getTopLevel(topLevel.getIdentity());
                if (remote == null) {
                    break;
                }

                if (!topLevel.equals(remote)) {
                    if ("3".equals(mode)) {
                        try {
                            sbh.replaceSBOL(URI.create(fetchUri));
                        } catch (SynBioHubException e) {
                            log.warn("replaceSBOL failed for {}", identity, e);
                        }
                    } else {
                        throw new ResponseStatusException(HttpStatus.CONFLICT,
                                "Submission terminated.\nA submission with this id already exists,"
                                        + " and it includes an object: " + identity
                                        + " that is already in this repository and has different content");
                    }
                } else {
                    log.debug("Found duplicate registry object, keeping as member: {}", identity);
                    try {
                        doc.removeTopLevel(topLevel);
                        if (rootCollection != null) {
                            rootCollection.addMember(topLevel.getIdentity());
                        }
                    } catch (SBOLValidationException e) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                "Failed to merge duplicate object: " + e.getMessage());
                    }
                }
                break;
            }
        }
    }

    /** Clears name/description/creator on the existing root collection so merge keeps store metadata. */
    private static void stripExistingRootCollectionMetadata(TopLevel topLevel) {
        topLevel.unsetDescription();
        topLevel.unsetName();
        topLevel.clearWasDerivedFroms();
        Annotation creator = topLevel.getAnnotation(DC_CREATOR);
        if (creator != null) {
            topLevel.removeAnnotation(creator);
        }
    }

    /** Rewrites user-scoped image paths in sbh:mutable* HTML to public collection URLs. */
    private void fixMutableAnnotations(SubmitPayload payload) {
        String displayId = payload.collectionDisplayId();
        if (displayId == null) {
            return;
        }
        String publicPrefix = "img src=\"/public/" + displayId.replace("_collection", "") + "/";
        SBOLDocument doc = payload.getSbolDocument();
        for (TopLevel topLevel : doc.getTopLevels()) {
            rewriteMutableAnnotation(topLevel, SBH_MUTABLE_DESCRIPTION, publicPrefix);
            rewriteMutableAnnotation(topLevel, SBH_MUTABLE_NOTES, publicPrefix);
            rewriteMutableAnnotation(topLevel, SBH_MUTABLE_PROVENANCE, publicPrefix);
        }
    }

    private void rewriteMutableAnnotation(TopLevel topLevel, QName qname, String publicPrefix) {
        Annotation annotation = topLevel.getAnnotation(qname);
        if (annotation == null || !annotation.isStringValue()) {
            return;
        }
        String value = annotation.getStringValue();
        String updated = MUTABLE_IMG_USER_PATH.matcher(value).replaceAll(publicPrefix);
        if (value.equals(updated)) {
            return;
        }
        try {
            topLevel.removeAnnotation(annotation);
            topLevel.createAnnotation(qname, updated);
        } catch (SBOLValidationException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Failed to rewrite mutable annotation: " + e.getMessage());
        }
    }

    /**
     * Adds all top-levels as collection members and applies optional {@code collectionChoices}
     * ({@code sbh:isMemberOf} annotations). Re-adds registry objects stripped earlier.
     */
    private void populateCollectionMembership(SubmitPayload payload) {
        String displayId = payload.collectionDisplayId();
        if (displayId == null) {
            return;
        }
        String version = payload.getVersion() != null ? payload.getVersion() : "1";
        SBOLDocument doc = payload.getSbolDocument();
        org.sbolstandard.core2.Collection rootCollection = doc.getCollection(displayId, version);
        if (rootCollection == null) {
            return;
        }

        URI rootIdentity = rootCollection.getIdentity();
        try {
            for (TopLevel topLevel : doc.getTopLevels()) {
                if (rootIdentity.equals(topLevel.getIdentity())) {
                    continue;
                }
                rootCollection.addMember(topLevel.getIdentity());
                for (String collectionChoice : payload.getCollectionChoices()) {
                    if (collectionChoice != null && collectionChoice.startsWith("http")) {
                        topLevel.createAnnotation(SBH_IS_MEMBER_OF, URI.create(collectionChoice));
                    }
                }
            }
            for (String uri : payload.getUrisFoundInSynBioHub()) {
                rootCollection.addMember(URI.create(uri));
            }
        } catch (SBOLValidationException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Failed to populate collection membership: " + e.getMessage());
        }
    }

    private static List<String> parseCollectionChoices(String raw) {
        if (raw == null || raw.isBlank()) {
            return new ArrayList<>();
        }
        return Arrays.stream(raw.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    /** Share token for fetching private user objects from remote registries during merge. */
    private static String registryFetchUri(String identity, String registry, String shareLinkSalt) {
        if (identity.startsWith(registry + "/user/")) {
            return identity + "/" + privateShareToken(identity, shareLinkSalt) + "/share";
        }
        return identity;
    }

    private static String privateShareToken(String identity, String shareLinkSalt) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-1");
            String innerHex = sha1Hex(md.digest((identity + "/edit").getBytes(StandardCharsets.UTF_8)));
            md.reset();
            String payload = "synbiohub_" + innerHex + (shareLinkSalt == null ? "" : shareLinkSalt);
            return sha1Hex(md.digest(payload.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-1 not available", e);
        }
    }

    private static String sha1Hex(byte[] digest) {
        StringBuilder sb = new StringBuilder(digest.length * 2);
        for (byte b : digest) {
            sb.append(String.format(Locale.US, "%02x", b & 0xff));
        }
        return sb.toString();
    }

    private String resolveUserAuthToken(SubmitPayload payload) {
        return authRepository.findByName(payload.getCreatedBy())
                .map(AuthCodes::getAuth)
                .orElse(null);
    }

    private static Map<String, String> webOfRegistriesMap() throws IOException {
        JsonNode node = ConfigUtil.get("webOfRegistries");
        Map<String, String> map = new LinkedHashMap<>();
        if (node != null && node.isObject()) {
            node.fields().forEachRemaining(entry -> map.put(entry.getKey(), entry.getValue().asText()));
        }
        return map;
    }

    /** Ensures sbh:topLevel is set on nested annotation trees (e.g. mutable HTML blocks). */
    private static void propagateTopLevelInNestedAnnotations(TopLevel topLevel, List<Annotation> annotations)
            throws SBOLValidationException {
        for (Annotation annotation : annotations) {
            if (!annotation.isNestedAnnotations()) {
                continue;
            }
            List<Annotation> nested = new ArrayList<>(annotation.getAnnotations());
            propagateTopLevelInNestedAnnotations(topLevel, nested);
            nested.removeIf(a -> SBH_TOP_LEVEL.equals(a.getQName()));
            nested.add(new Annotation(SBH_TOP_LEVEL, topLevel.getIdentity()));
            annotation.setAnnotations(nested);
        }
    }

    /**
     * Removes top-levels that belong to a configured web-of-registries prefix.
     * Their URIs are recorded so they can be re-added as collection members later.
     */
    private static void stripRegistryTopLevels(SBOLDocument individual,
                                                 List<String> registryPrefixes,
                                                 SubmitPayload payload) {
        for (TopLevel topLevel : new ArrayList<>(individual.getTopLevels())) {
            String identity = topLevel.getIdentity().toString();
            for (String registry : registryPrefixes) {
                if (identity.startsWith(registry)) {
                    log.debug("Found and removed registry object: {}", identity);
                    payload.getUrisFoundInSynBioHub().add(identity);
                    try {
                        individual.removeTopLevel(topLevel);
                    } catch (SBOLValidationException e) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                "Failed to remove registry object: " + e.getMessage());
                    }
                    break;
                }
            }
        }
    }

    /** Assigns submission URI prefix/version and fixes attachment download sources after rewrite. */
    private static SBOLDocument rewriteIndividualUris(SBOLDocument individual, String uriPrefix, String version,
                                                    String databasePrefix) throws SBOLValidationException {
        individual.setDefaultURIprefix("http://dummy.org/");
        if (uriPrefix == null) {
            return individual;
        }
        if (individual.getTopLevels().isEmpty()) {
            individual.setDefaultURIprefix(uriPrefix);
            return individual;
        }
        individual = individual.changeURIPrefixVersion(uriPrefix, null, version);
        individual.setDefaultURIprefix(uriPrefix);
        for (Attachment attachment : individual.getAttachments()) {
            String source = attachment.getSource().toString();
            if (source.startsWith(databasePrefix) && source.endsWith("/download")) {
                attachment.setSource(URI.create(attachment.getIdentity().toString() + "/download"));
            }
        }
        return individual;
    }

    private static String displayIdFromFilename(String filename) {
        String displayId = filename;
        int dot = displayId.lastIndexOf('.');
        if (dot != -1) {
            displayId = displayId.substring(0, dot);
        }
        int slash = displayId.lastIndexOf('/');
        if (slash != -1) {
            displayId = displayId.substring(slash + 1);
        }
        return displayId;
    }

    private static String fixDisplayId(String displayId) {
        if (displayId == null || displayId.isEmpty()) {
            return "_";
        }
        displayId = displayId.replaceAll("[^a-zA-Z0-9_]", "_");
        displayId = displayId.replace(" ", "_");
        if (Character.isDigit(displayId.charAt(0))) {
            displayId = "_" + displayId;
        }
        return displayId;
    }

    /** {@code sbh:user/<username>} URI used for ownedBy annotations. */
    private static String resolveOwnedByPrefix(SubmitPayload payload) throws IOException {
        return ConfigUtil.get("databasePrefix").asText() + "user/" + payload.getCreatedBy();
    }

    private void failReadSbol(String readLog, String errorLog) {
        log.debug("readSbol failed:\n{}\n{}", readLog, errorLog);
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, errorLog);
    }

    // --- readSbol: classify uploaded file(s) into sbolFiles / attachmentFiles ---

    /** Unpacks or classifies the uploaded file. */
    private void classifySubmitInput(SubmitPayload payload) throws IOException {
        if (payload.getUploadedFilePath() == null) {
            return;
        }
        Path input = Path.of(payload.getUploadedFilePath());
        if (!Files.isRegularFile(input)) {
            return;
        }

        String ext = fileExtension(input);
        if (OFFICE_EXTENSIONS.contains(ext)) {
            payload.getSbolFiles().add(input);
            return;
        }
        if ("omex".equals(ext) || isCombineArchive(input)) {
            extractSubmitArchive(input, payload, true);
            return;
        }
        if ("zip".equals(ext)) {
            // Generic zip: unpack and classify; not flagged as COMBINE.
            extractSubmitArchive(input, payload, false);
            return;
        }

        classifySubmitFile(input, payload);
    }

    /** Extracts a zip/omex archive and classifies each entry; sets {@code extractDirPath}. */
    private void extractSubmitArchive(Path archive, SubmitPayload payload, boolean combine)
            throws IOException {
        Path dest = Files.createTempDirectory("sbh-submit-unpack-");
        payload.setExtractDirPath(dest.toAbsolutePath().toString());
        try (ZipFile zip = new ZipFile(archive.toFile())) {
            var entries = zip.entries();
            while (entries.hasMoreElements()) {
                ZipEntry entry = entries.nextElement();
                if (entry.isDirectory()) {
                    continue;
                }
                Path out = dest.resolve(entry.getName()).normalize();
                if (!out.startsWith(dest)) {
                    continue; // zip-slip guard
                }
                Files.createDirectories(out.getParent());
                try (InputStream in = zip.getInputStream(entry)) {
                    Files.copy(in, out);
                }
                classifySubmitFile(out, payload);
            }
        }
        if (combine && payload.getSbolFiles().isEmpty()) {
            payload.getSbolFiles().add(archive);
        }
    }

    /** COMBINE archives contain a manifest.xml entry. */
    private boolean isCombineArchive(Path file) throws IOException {
        if (!"zip".equals(fileExtension(file)) && !"omex".equals(fileExtension(file))) {
            return false;
        }
        try (ZipFile zip = new ZipFile(file.toFile())) {
            return zip.getEntry("manifest.xml") != null
                    || zip.stream().anyMatch(e -> e.getName().endsWith("manifest.xml"));
        }
    }

    /** Routes a single file into sbolFiles or attachmentFiles. */
    private void classifySubmitFile(Path file, SubmitPayload payload) throws IOException {
        switch (guessSubmitFileFormat(file)) {
            case SBOL, GENBANK, FASTA, GFF3 -> payload.getSbolFiles().add(file);
            case ATTACHMENT -> payload.getAttachmentFiles().add(file);
        }
    }

    private enum SubmitFileFormat {
        SBOL, GENBANK, FASTA, GFF3, ATTACHMENT
    }

    /** Sniffs file content and extension; anything unrecognized becomes an attachment. */
    private SubmitFileFormat guessSubmitFileFormat(Path file) throws IOException {
        String path = file.toAbsolutePath().toString();
        if (SBOLReader.isGenBankFile(path)) {
            return SubmitFileFormat.GENBANK;
        }
        if (SBOLReader.isFastaFile(path)) {
            return SubmitFileFormat.FASTA;
        }
        if (SBOLReader.isGFF3File(path)) {
            return SubmitFileFormat.GFF3;
        }

        String head = readFileHead(file, 4096).toLowerCase();
        if (head.contains("sbols.org") || head.contains("sbol.org") || head.contains("<rdf:rdf")) {
            return SubmitFileFormat.SBOL;
        }

        String ext = fileExtension(file);
        if (Set.of("xml", "sbol", "rdf").contains(ext)) {
            return SubmitFileFormat.SBOL;
        }
        if ("gb".equals(ext) || "gbk".equals(ext)) {
            return SubmitFileFormat.GENBANK;
        }
        if ("fasta".equals(ext) || "fa".equals(ext)) {
            return SubmitFileFormat.FASTA;
        }
        if ("gff".equals(ext) || "gff3".equals(ext)) {
            return SubmitFileFormat.GFF3;
        }

        return SubmitFileFormat.ATTACHMENT;
    }

    private static String readFileHead(Path file, int maxBytes) throws IOException {
        byte[] buf = new byte[maxBytes];
        int read;
        try (InputStream in = Files.newInputStream(file)) {
            read = in.read(buf);
        }
        if (read <= 0) {
            return "";
        }
        return new String(buf, 0, read, StandardCharsets.UTF_8);
    }

    private static String fileExtension(Path file) {
        String ext = FilenameUtils.getExtension(file.getFileName().toString());
        return ext == null ? "" : ext.toLowerCase();
    }

    /** Initializes per-submission lists and an empty composite SBOLDocument. */
    private void setupReadSbol(SubmitPayload payload) {
        payload.setAttachmentFiles(new ArrayList<>());
        payload.setSbolFiles(new ArrayList<>());
        payload.setUrisFoundInSynBioHub(new HashSet<>());

        SBOLDocument doc = new SBOLDocument();
        String uriPrefix = uriPrefix(payload);
        if (uriPrefix != null) {
            doc.setDefaultURIprefix(uriPrefix);
        }
        payload.setSbolDocument(doc);
        payload.setReadSbolStartedAtMs(System.currentTimeMillis());
        log.debug("readSbol setup: uriPrefix={}", uriPrefix);
    }

    // -------------------------------------------------------------------------
    // prepare — delete existing triples before overwrite (overwrite_merge == 1)
    // -------------------------------------------------------------------------

    /**
     * Overwrite mode: stagger-delete all objects under the collection URI prefix, then remove
     * the collection itself. Mirrors {@code submit.js} after prepareSubmission succeeds.
     */
    private void prepare(SubmitPayload payload) throws IOException {
        if (!"1".equals(payload.getOverwriteMerge())) {
            return;
        }
        String collectionUri = payload.getCollectionUri();
        String uriPrefix = uriPrefixFromCollectionUri(payload, collectionUri);
        if (collectionUri == null || uriPrefix == null) {
            return;
        }

        String graphUri = graphUriForCollection(collectionUri, payload);
        Map<String, String> templateParams = Map.of(
                "collection", collectionUri,
                "uriPrefix", uriPrefix);

        log.debug("prepare overwrite: removing {}", uriPrefix);
        deleteStaggered(new SPARQLQuery(REMOVE_COLLECTION_SPARQL).loadTemplate(templateParams), graphUri);
        deleteStaggered(new SPARQLQuery(REMOVE_SPARQL).loadTemplate(Map.of("uri", collectionUri)), graphUri);

        if (ConfigUtil.get("useSBOLExplorer").asBoolean(false)) {
            notifyExplorerRemoveCollection(collectionUri, uriPrefix);
        }
    }

    /**
     * Virtuoso DELETE templates return one row per batch; loop until nothing remains.
     * Legacy {@code sparql.deleteStaggered}.
     */
    private void deleteStaggered(String update, String graphUri) throws IOException {
        while (true) {
            String raw = sparqlAuthUpdate(update, graphUri, true);
            JsonNode bindings = JSON.readTree(raw).path("results").path("bindings");
            if (!bindings.isArray() || bindings.isEmpty()) {
                break;
            }
            String msg = bindings.get(0).path("callret-0").path("value").asText("");
            if (msg.contains("nothing to do")) {
                break;
            }
        }
    }

    /**
     * POST a SPARQL update to sparql-auth with digest auth (not preemptive basic auth).
     *
     * @param jsonResults when {@code true}, requests {@code application/sparql-results+json}
     */
    private String sparqlAuthUpdate(String update, String graphUri, boolean jsonResults) throws IOException {
        StringBuilder url = new StringBuilder(sparqlAuthEndpoint());
        url.append("?query=").append(URLEncoder.encode(update, StandardCharsets.UTF_8));
        url.append("&default-graph-uri=").append(URLEncoder.encode(graphUri, StandardCharsets.UTF_8));
        if (jsonResults) {
            url.append("&format=")
                    .append(URLEncoder.encode("application/sparql-results+json", StandardCharsets.UTF_8));
        }

        try (CloseableHttpClient client = virtuosoDigestClient()) {
            HttpPost post = new HttpPost(url.toString());
            return client.execute(post, response -> {
                int code = response.getCode();
                if (code >= 300) {
                    throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                            "SPARQL update failed (" + code + "): " + readResponseBody(response));
                }
                return readResponseBody(response);
            });
        }
    }

    /** HttpClient configured for Virtuoso digest auth (waits for 401 challenge). */
    private static CloseableHttpClient virtuosoDigestClient() throws IOException {
        BasicCredentialsProvider credsProvider = new BasicCredentialsProvider();
        credsProvider.setCredentials(
                new AuthScope(null, -1),
                new UsernamePasswordCredentials(
                        ConfigUtil.get("username").asText(),
                        ConfigUtil.get("password").asText().toCharArray()));
        return HttpClients.custom()
                .setDefaultCredentialsProvider(credsProvider)
                .build();
    }

    private static String readResponseBody(org.apache.hc.core5.http.ClassicHttpResponse response)
            throws IOException {
        if (response.getEntity() == null) {
            return "";
        }
        return new String(response.getEntity().getContent().readAllBytes(), StandardCharsets.UTF_8);
    }

    /** Derives sparql-auth URL from config (explicit or inferred from sparqlEndpoint). */
    private static String sparqlAuthEndpoint() throws IOException {
        JsonNode configured = ConfigUtil.get("sparqlAuthEndpoint");
        if (configured != null && !configured.isNull() && !configured.asText().isBlank()) {
            return configured.asText();
        }
        String base = ConfigUtil.get("sparqlEndpoint").asText();
        if (base.endsWith("-auth") || base.endsWith("-auth/")) {
            return base;
        }
        return base.replaceAll("/sparql/?$", "/sparql-auth");
    }

    private void notifyExplorerRemoveCollection(String collectionUri, String uriPrefix) throws IOException {
        String endpoint = ConfigUtil.get("SBOLExplorerEndpoint").asText();
        if (!endpoint.endsWith("/")) {
            endpoint += "/";
        }
        String url = endpoint + "incrementalremovecollection?subject="
                + URLEncoder.encode(collectionUri, StandardCharsets.UTF_8)
                + "&uriPrefix=" + URLEncoder.encode(uriPrefix, StandardCharsets.UTF_8);
        try {
            new RestTemplate().getForEntity(url, String.class);
        } catch (Exception e) {
            log.warn("SBOLExplorer incrementalremovecollection failed", e);
        }
    }

    // -------------------------------------------------------------------------
    // upload — graph store RDF POST + attachment files + temp cleanup
    // -------------------------------------------------------------------------

    /**
     * Posts prepared SBOL XML to Virtuoso, stores attachment binaries, rewrites {@code file:}
     * sources in the graph, then deletes temp files.
     */
    private void upload(SubmitPayload payload) throws IOException {
        String graphUri = graphUriForCollection(payload.getCollectionUri(), payload);
        String resultPath = payload.getResultFilePath();
        if (resultPath == null || resultPath.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No prepared SBOL file to upload.");
        }

        log.debug("upload: posting RDF to graph {}", graphUri);
        uploadGraphStore(graphUri, Path.of(resultPath));

        if (!payload.getAttachmentFiles().isEmpty()) {
            uploadAttachments(payload, graphUri);
        }

        cleanupSubmitTemp(payload);
    }

    /**
     * POST RDF/XML to the Virtuoso graph store. Uses digest auth (not preemptive basic auth),
     * matching legacy {@code sparql.uploadSmallFile}.
     */
    private void uploadGraphStore(String graphUri, Path file) throws IOException {
        String endpoint = ConfigUtil.get("graphStoreEndpoint").asText();
        String url = endpoint
                + (endpoint.contains("?") ? "&" : "?")
                + "graph-uri=" + URLEncoder.encode(graphUri, StandardCharsets.UTF_8);

        byte[] body = Files.readAllBytes(file);
        try (CloseableHttpClient client = virtuosoDigestClient()) {
            HttpPost post = new HttpPost(url);
            post.setHeader(HttpHeaders.CONTENT_TYPE, "application/rdf+xml");
            post.setEntity(new ByteArrayEntity(body, ContentType.APPLICATION_XML));
            client.execute(post, response -> {
                int code = response.getCode();
                if (code >= 300) {
                    throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                            "Graph store upload failed (" + code + "): " + readResponseBody(response));
                }
                return null;
            });
        }
    }

    /**
     * For each non-SBOL attachment: gzip+hash to {@code ./uploads/}, insert or update triples,
     * then rewrite {@code file:filename} placeholders to real attachment URIs.
     */
    private void uploadAttachments(SubmitPayload payload, String graphUri) throws IOException {
        String collectionUri = payload.getCollectionUri();
        String baseUri = attachmentBaseUri(payload);
        Map<String, String> existingSources = loadAttachmentSources(collectionUri, graphUri);

        for (Path attachmentPath : payload.getAttachmentFiles()) {
            String attachmentType = attachmentTypeFromExtension(attachmentPath);
            if (attachmentType.toLowerCase(Locale.ROOT).contains("sbol")) {
                continue;
            }

            UploadInfo upload = createUpload(attachmentPath);
            String filename = attachmentPath.getFileName().toString();
            String fileKey = "file:" + filename; // placeholder source URI from SBOL during readSbol

            if (existingSources.containsKey(fileKey)) {
                updateAttachment(graphUri, existingSources.get(fileKey), upload.hash(), upload.size());
                continue;
            }

            String attachmentUri = addAttachmentToTopLevel(
                    graphUri,
                    baseUri,
                    collectionUri,
                    filename,
                    upload.hash(),
                    upload.size(),
                    attachmentType,
                    payload.getCreatedBy());

            String update = new SPARQLQuery(ATTACHMENT_UPDATE_SPARQL).loadTemplate(Map.of(
                    "oldUri", fileKey,
                    "newUri", attachmentUri));
            sparqlAuthUpdate(update, graphUri, false);
        }
    }

    /** {@code databasePrefix + user/<username>/<collectionId>} — parent URI for new attachments. */
    private String attachmentBaseUri(SubmitPayload payload) throws IOException {
        String databasePrefix = ConfigUtil.get("databasePrefix").asText();
        String username = URLEncoder.encode(payload.getCreatedBy(), StandardCharsets.UTF_8);
        String collectionId = payload.getId();
        if (collectionId == null) {
            collectionId = payload.collectionDisplayId().replace("_collection", "");
        }
        return databasePrefix + "user/" + username + "/" + collectionId;
    }

    /** Maps existing {@code sbol:source} values (e.g. {@code file:foo.png}) to attachment URIs. */
    private Map<String, String> loadAttachmentSources(String collectionUri, String graphUri) throws IOException {
        String query = new SPARQLQuery(GET_ATTACHMENT_SOURCE_SPARQL)
                .loadTemplate(Map.of("uri", collectionUri));
        String raw = searchService.SPARQLQuery(query, graphUri);
        Map<String, String> sources = new HashMap<>();
        JsonNode bindings = JSON.readTree(raw).path("results").path("bindings");
        if (!bindings.isArray()) {
            return sources;
        }
        for (JsonNode row : bindings) {
            String source = row.path("source").path("value").asText(null);
            String attachment = row.path("attachment").path("value").asText(null);
            if (source != null && attachment != null) {
                sources.put(source, attachment);
            }
        }
        return sources;
    }

    /** Inserts attachment triples and links them to the root collection ({@code AttachUpload.sparql}). */
    private String addAttachmentToTopLevel(String graphUri, String baseUri, String topLevelUri,
                                             String name, String uploadHash, long size, String attachmentType,
                                             String owner) throws IOException {
        String displayId = "attachment_" + UUID.randomUUID().toString().replace("-", "");
        String persistentIdentity = baseUri + "/" + displayId;
        String version = "1";
        String attachmentUri = persistentIdentity + "/" + version;
        String collectionUri = baseUri + baseUri.substring(baseUri.lastIndexOf('/'))
                + "_collection/" + version;
        String ownedBy = ConfigUtil.get("databasePrefix").asText()
                + "user/" + URLEncoder.encode(owner, StandardCharsets.UTF_8);

        Map<String, String> templateParams = new HashMap<>();
        templateParams.put("collectionUri", collectionUri);
        templateParams.put("topLevel", topLevelUri);
        templateParams.put("attachmentURI", attachmentUri);
        templateParams.put("attachmentSource", attachmentUri + "/download");
        templateParams.put("persistentIdentity", persistentIdentity);
        templateParams.put("displayId", sparqlStringLiteral(displayId));
        templateParams.put("version", sparqlStringLiteral(version));
        templateParams.put("name", sparqlStringLiteral(name));
        templateParams.put("description", sparqlStringLiteral(""));
        templateParams.put("hash", sparqlStringLiteral(uploadHash));
        templateParams.put("size", sparqlStringLiteral(Long.toString(size)));
        templateParams.put("type", attachmentType);
        templateParams.put("ownedBy", ownedBy);
        String update = new SPARQLQuery(ATTACH_UPLOAD_SPARQL).loadTemplate(templateParams);
        sparqlAuthUpdate(update, graphUri, false);
        return attachmentUri;
    }

    /** Replaces hash/size on an existing attachment when re-uploading the same {@code file:} source. */
    private void updateAttachment(String graphUri, String attachmentUri, String uploadHash, long size)
            throws IOException {
        String update = new SPARQLQuery(UPDATE_ATTACHMENT_SPARQL).loadTemplate(Map.of(
                "attachmentURI", attachmentUri,
                "attachmentSource", attachmentUri + "/download",
                "hash", sparqlStringLiteral(uploadHash),
                "size", sparqlStringLiteral(Long.toString(size))));
        sparqlAuthUpdate(update, graphUri, false);
    }

    private String attachmentTypeFromExtension(Path file) throws IOException {
        String ext = fileExtension(file);
        JsonNode mapping = ConfigUtil.get("fileExtensionToAttachmentType");
        if (mapping != null && mapping.has(ext)) {
            return mapping.get(ext).asText();
        }
        return UNKNOWN_ATTACHMENT_TYPE;
    }

    /**
     * Content-addressed storage: SHA-1 hash, gzip to {@code uploads/<prefix>/<rest>.gz}.
     * Skips write when the file already exists (legacy {@code uploads.createUpload}).
     */
    private UploadInfo createUpload(Path file) throws IOException {
        byte[] raw = Files.readAllBytes(file);
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-1");
            String hash = sha1Hex(digest.digest(raw));
            Path dest = uploadPath(hash);
            if (!Files.exists(dest)) {
                Files.createDirectories(dest.getParent());
                try (GZIPOutputStream gzip = new GZIPOutputStream(Files.newOutputStream(dest))) {
                    gzip.write(raw);
                }
            }
            return new UploadInfo(hash, raw.length);
        } catch (NoSuchAlgorithmException e) {
            throw new IOException("SHA-1 not available", e);
        }
    }

    private static Path uploadPath(String hash) {
        return Path.of("uploads", hash.substring(0, 2), hash.substring(2) + ".gz");
    }

    /** Escapes a value for substitution into SPARQL string literal positions in templates. */
    private static String sparqlStringLiteral(String value) {
        return "\"" + value.replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
    }

    /** Removes unpack directory and prepared SBOL XML after successful upload. */
    private void cleanupSubmitTemp(SubmitPayload payload) throws IOException {
        String extractDir = payload.getExtractDirPath();
        if (extractDir != null && !extractDir.isBlank()) {
            deleteRecursive(Path.of(extractDir));
        }
        String resultPath = payload.getResultFilePath();
        if (resultPath != null && !resultPath.isBlank()) {
            Files.deleteIfExists(Path.of(resultPath));
        }
    }

    private static void deleteRecursive(Path root) throws IOException {
        if (!Files.exists(root)) {
            return;
        }
        try (var walk = Files.walk(root)) {
            walk.sorted((a, b) -> b.compareTo(a))
                    .forEach(path -> {
                        try {
                            Files.deleteIfExists(path);
                        } catch (IOException e) {
                            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                                    "Failed to delete " + path, e);
                        }
                    });
        }
    }

    private record UploadInfo(String hash, long size) {}

    // -------------------------------------------------------------------------
    // response / small helpers
    // -------------------------------------------------------------------------

    private ResponseEntity<String> successResponse() {
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/plain; charset=UTF-8"))
                .body("Submission successful");
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static String sanitizeFilename(String name) {
        if (name == null || name.isBlank()) {
            return "upload";
        }
        return FilenameUtils.getName(name).replaceAll("[^a-zA-Z0-9._-]", "_");
    }


    /**
     * URI prefix for new objects in this submission
     * (e.g. {@code https://synbiohub.org/user/alice/myproject/}).
     */
    public String uriPrefix(SubmitPayload payload) {
        String graphUri = userService.getUserByUsername(payload.getCreatedBy()).getGraphUri();
        if (payload.getCreatedBy() == null || graphUri == null || payload.getId() == null) {
            if (payload.getCollectionUri() == null) {
                return null;
            }
            return uriPrefixFromCollectionUri(payload, payload.getCollectionUri());
        }
        String base = graphUri.endsWith("/") ? graphUri : graphUri + "/";
        return base + payload.getId() + "/";
    }

    /**
     * Derives the object URI prefix from a root collection identity URI by removing
     * {@code {displayId}/{version}}.
     */
    public String uriPrefixFromCollectionUri(SubmitPayload payload, String collectionUri) {
        int lastSlash = collectionUri.lastIndexOf('/');
        if (lastSlash <= 0) {
            return null;
        }
        int prevSlash = collectionUri.lastIndexOf('/', lastSlash - 1);
        if (prevSlash <= 0) {
            return null;
        }
        return collectionUri.substring(0, prevSlash + 1);
    }
}