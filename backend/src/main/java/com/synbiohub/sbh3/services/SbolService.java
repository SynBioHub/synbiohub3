package com.synbiohub.sbh3.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.synbiohub.sbh3.submit.SubmitPayload;
import com.synbiohub.sbh3.utils.ConfigUtil;
import com.synbiohub.sbh3.utils.FileUtil;
import com.synbiohub.sbh3.utils.StringUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.sbolstandard.core2.*;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;
import org.synbiohub.frontend.SynBioHubException;
import org.synbiohub.frontend.SynBioHubFrontend;

import javax.xml.namespace.QName;
import java.io.*;
import java.net.URI;
import java.net.URISyntaxException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class SbolService {

    private final CollectionService collectionService;
    private final UserService userService;
    private final ObjectMapper objectMapper;

    /**
     * Office uploads are passed through to SBOL validation (SynBioHub Excel plugin
     * path).
     */
    static final Set<String> OFFICE_EXTENSIONS = Set.of(
            "xlsx", "xls", "docx", "doc", "pptx", "ppt");
    static final QName SBH_MUTABLE_DESCRIPTION = new QName("http://wiki.synbiohub.org/wiki/Terms/synbiohub#",
            "mutableDescription", "sbh");
    static final QName SBH_MUTABLE_NOTES = new QName("http://wiki.synbiohub.org/wiki/Terms/synbiohub#", "mutableNotes",
            "sbh");
    static final QName SBH_MUTABLE_PROVENANCE = new QName("http://wiki.synbiohub.org/wiki/Terms/synbiohub#",
            "mutableProvenance", "sbh");
    static final QName DC_CREATOR = new QName("http://purl.org/dc/elements/1.1/", "creator", "dc");
    static final QName DCTERMS_CREATED = new QName("http://purl.org/dc/terms/", "created", "dcterms");
    static final QName OBO_PUBMED = new QName("http://purl.obolibrary.org/obo/", "OBI_0001617", "obo");
    // SynBioHub-specific annotation QNames used when annotating submitted objects.
    static final QName SBH_OWNED_BY = new QName("http://wiki.synbiohub.org/wiki/Terms/synbiohub#", "ownedBy", "sbh");
    static final QName SBH_TOP_LEVEL = new QName("http://wiki.synbiohub.org/wiki/Terms/synbiohub#", "topLevel", "sbh");
    /**
     * Rewrites {@code img src="/user/.../"} paths in mutable HTML to the public
     * collection path.
     */
    static final Pattern MUTABLE_IMG_USER_PATH = Pattern.compile("img src=\\\"/user/[^/]*/[^/]*/");

    // -------------------------------------------------------------------------
    // readSbol — validate/convert input, build composite SBOLDocument (PrepareSubmissionJob)
    // -------------------------------------------------------------------------

    /**
     * SBOL preparation pipeline. Produces {@code payload.resultFilePath} (serialized XML).
     */
    public void readSbol(SubmitPayload payload, Map<String, String> webOfRegistriesMap, String ownedByUri, String authToken) throws IOException, SBOLValidationException {
        setupReadSbol(payload);
        classifySubmitInput(payload);
        mergeValidatedSbolFiles(payload, webOfRegistriesMap);
        prepareRootCollection(payload, ownedByUri);
        mergeIntoExistingCollection(payload, authToken, webOfRegistriesMap);   // modes 2/3 only
        fixMutableAnnotations(payload);
        collectionService.populateCollectionMembership(payload);
        if (ConfigUtil.get("useSBOLExplorer").asBoolean(false)) {
            incrementallyUpdateSbolExplorer(payload, ownedByUri);
        }
        finishReadSbol(payload);
    }

    /**
     * Initializes per-submission lists and an empty composite SBOLDocument.
     */
    private void setupReadSbol(SubmitPayload payload) {
        payload.setAttachmentFiles(new ArrayList<>());
        payload.setSbolFiles(new ArrayList<>());
        payload.setUrisFoundInSynBioHub(new HashSet<>());

        SBOLDocument doc = new SBOLDocument();
        String uriPrefix = collectionService.uriPrefix(payload);
        if (uriPrefix != null) {
            doc.setDefaultURIprefix(uriPrefix);
        }
        payload.setSbolDocument(doc);
        payload.setReadSbolStartedAtMs(System.currentTimeMillis());
        log.debug("readSbol setup: uriPrefix={}", uriPrefix);
    }

    // --- readSbol: classify uploaded file(s) into sbolFiles / attachmentFiles ---

    /**
     * Unpacks or classifies the uploaded file.
     */
    private void classifySubmitInput(SubmitPayload payload) throws IOException {
        if (payload.getUploadedFilePath() == null) {
            return;
        }
        Path input = Path.of(payload.getUploadedFilePath());
        if (!Files.isRegularFile(input)) {
            return;
        }

        String ext = FileUtil.fileExtension(input);
        if (OFFICE_EXTENSIONS.contains(ext)) {
            payload.getSbolFiles().add(input);
            return;
        }
        if ("omex".equals(ext) || FileUtil.isCombineArchive(input)) {
            FileUtil.extractSubmitArchive(input, payload, true);
            return;
        }
        if ("zip".equals(ext)) {
            // Generic zip: unpack and classify; not flagged as COMBINE.
            FileUtil.extractSubmitArchive(input, payload, false);
            return;
        }

        FileUtil.classifySubmitFile(input, payload);
    }

    /**
     * Validates each SBOL input file, strips registry objects, rewrites URIs to the submission
     * prefix, and merges into the composite document on {@code payload}.
     */
    private void mergeValidatedSbolFiles(SubmitPayload payload, Map<String, String> webOfRegistriesMap) throws IOException {
        String databasePrefix = ConfigUtil.get("databasePrefix").asText();
        String uriPrefix = collectionService.uriPrefix(payload);
        String version = payload.getVersion() != null ? payload.getVersion() : "1";

        boolean requireComplete = ConfigUtil.get("requireComplete").asBoolean(false);
        boolean requireCompliant = ConfigUtil.get("requireCompliant").asBoolean(false);
        boolean enforceBestPractices = ConfigUtil.get("requireBestPractice").asBoolean(false);
        List<String> registryPrefixes = new ArrayList<>(webOfRegistriesMap.keySet());

        StringBuilder readLog = new StringBuilder();
        SBOLDocument composite = payload.getSbolDocument();

        for (Path file : payload.getSbolFiles()) {
            String filename = file.toString();
            String defaultDisplayId = StringUtil.fixDisplayId(StringUtil.displayIdFromFilename(filename));

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
    private void prepareRootCollection (SubmitPayload payload, String ownedByUri) throws IOException, SBOLValidationException {
        SBOLDocument doc = payload.getSbolDocument();
        String version = payload.getVersion() != null ? payload.getVersion() : "1";

        String displayId = payload.collectionDisplayId();
        if (displayId == null) {
            return;
        }
        org.sbolstandard.core2.Collection root = collectionService.getRootCollection(doc, displayId, version);
        applySubmitRootCollection(payload, doc, root, ownedByUri);
    }

    /**
     * Merge modes 2/3: for objects whose URIs already exist in a configured registry,
     * fetch from remote SynBioHub and either reject (different content), replace (mode 3),
     * or keep as collection members (identical content).
     */
    private void mergeIntoExistingCollection(SubmitPayload payload, String authToken, Map<String, String> registries) throws IOException {
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

    /** Notifies SBOL Explorer of added top-levels after a successful submit (when enabled). */
    private void incrementallyUpdateSbolExplorer(SubmitPayload payload, String ownedByUri) throws IOException {
        ObjectNode body = objectMapper.createObjectNode();
        body.set("partsToRemove", objectMapper.createArrayNode());
        ArrayNode partsToAdd = objectMapper.createArrayNode();
        for (TopLevel topLevel : payload.getSbolDocument().getTopLevels()) {
            ObjectNode part = objectMapper.createObjectNode();
            part.put("subject", topLevel.getIdentity().toString());
            part.put("displayId", topLevel.getDisplayId());
            part.put("version", topLevel.getVersion());
            part.put("name", topLevel.getName());
            part.put("description", topLevel.getDescription());
            part.put("type", "TODO");
            part.put("graph", ownedByUri);
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

    private void failReadSbol(String readLog, String errorLog) {
        log.debug("readSbol failed:\n{}\n{}", readLog, errorLog);
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, errorLog);
    }

    /**
     * Removes top-levels that belong to a configured web-of-registries prefix.
     * Their URIs are recorded so they can be re-added as collection members later.
     */
    private void stripRegistryTopLevels(SBOLDocument individual,
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
    private SBOLDocument rewriteIndividualUris(SBOLDocument individual, String uriPrefix, String version,
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

    /** Sets name, description, creator, citations, ownedBy, and topLevel on all identified objects. */
    private void applySubmitRootCollection(SubmitPayload payload, SBOLDocument doc,
                                           org.sbolstandard.core2.Collection root,
                                           String ownedByUri) {
        try {
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

    /** Clears name/description/creator on the existing root collection so merge keeps store metadata. */
    private void stripExistingRootCollectionMetadata(TopLevel topLevel) {
        topLevel.unsetDescription();
        topLevel.unsetName();
        topLevel.clearWasDerivedFroms();
        Annotation creator = topLevel.getAnnotation(DC_CREATOR);
        if (creator != null) {
            topLevel.removeAnnotation(creator);
        }
    }

    /** Share token for fetching private user objects from remote registries during merge. */
    private String registryFetchUri(String identity, String registry, String shareLinkSalt) {
        if (identity.startsWith(registry + "/user/")) {
            return identity + "/" + privateShareToken(identity, shareLinkSalt) + "/share";
        }
        return identity;
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

    private String privateShareToken(String identity, String shareLinkSalt) {
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

    public String sha1Hex(byte[] digest) {
        StringBuilder sb = new StringBuilder(digest.length * 2);
        for (byte b : digest) {
            sb.append(String.format(Locale.US, "%02x", b & 0xff));
        }
        return sb.toString();
    }

    /** Ensures sbh:topLevel is set on nested annotation trees (e.g. mutable HTML blocks). */
    private void propagateTopLevelInNestedAnnotations(TopLevel topLevel, List<Annotation> annotations)
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
}
