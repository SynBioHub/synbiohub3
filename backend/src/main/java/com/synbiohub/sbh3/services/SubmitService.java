package com.synbiohub.sbh3.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.synbiohub.sbh3.dao.SparqlService;
import com.synbiohub.sbh3.security.model.AuthCodes;
import com.synbiohub.sbh3.security.repo.AuthRepository;
import com.synbiohub.sbh3.submit.SubmitPayload;
import com.synbiohub.sbh3.submit.SubmitPluginService;
import com.synbiohub.sbh3.utils.ConfigUtil;
import com.synbiohub.sbh3.utils.FileUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.sbolstandard.core2.SBOLConversionException;
import org.sbolstandard.core2.SBOLDocument;
import org.sbolstandard.core2.SBOLValidationException;
import org.sbolstandard.core2.SBOLWriter;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.Map;

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
public class SubmitService {

    private final AuthRepository authRepository;
    private final SubmitPluginService submitPluginService;
    private final CitationService citationService;
    private final CollectionService collectionService;
    private final SbolService sbolService;
    private final SparqlService sparqlService;
    private final AttachmentService attachmentService;
    private final UserService userService;
    private final DownloadService downloadService;

    /**
     * Main submit entry point. Each step mutates {@code payload} in place.
     */
    public ResponseEntity<String> submit(SubmitPayload allParams, MultipartFile file) throws IOException, SBOLValidationException {
        SubmitPayload payload = parse(allParams, file);
        collectionService.sanitize(payload);
        submitPluginService.applySubmitPlugin(payload); // optional transform of uploaded file
        sbolService.readSbol(payload, webOfRegistriesMap(),
                ConfigUtil.get("databasePrefix").asText() + "user/" + payload.getCreatedBy(),
                resolveUserAuthToken(payload));
        prepare(payload);  // only runs for overwrite_merge == 1
        upload(payload);
        return successResponse();
    }

    /**
     * Moves a private user collection into the public graph (as a new public collection or merged
     * into an existing public collection), reusing the {@code submit} pipeline.
     * Mirrors legacy SBH1 {@code lib/actions/makePublic.js}.
     */
    public ResponseEntity<String> makePublic(
            String userId, String collectionId, String displayId, String version,
            Map<String, String> allParams) throws IOException, SBOLValidationException {
        String databasePrefix = ConfigUtil.get("databasePrefix").asText();
        String sourceUri = databasePrefix + "user/" + userId + "/" + collectionId + "/" + displayId + "/" + version;

        if (!userService.isOwnedBy(sourceUri)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Not authorized to make this submission public");
        }

        String tabState = allParams.getOrDefault("tabState", "existing").trim();
        boolean creatingNew = "new".equals(tabState);

        SubmitPayload payload = new SubmitPayload();
        payload.setTargetPublic(true);
        payload.setSourceUriPrefix(collectionService.uriPrefixFromCollectionUri(null, sourceUri));
        payload.setCreatedBy(SecurityContextHolder.getContext().getAuthentication().getName());
        String rawCitations = allParams.get("citations");
        if (rawCitations != null && "undefined".equalsIgnoreCase(rawCitations.trim())) {
            rawCitations = "";
        }
        payload.setCitations(rawCitations);
        payload.setCitationPubmedIds(citationService.parseCitationPubmedIds(payload.getCitations()));

        if (creatingNew) {
            String targetId = allParams.getOrDefault("id", "").trim();
            String targetVersion = allParams.getOrDefault("version", "").trim();
            if (targetId.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Please enter an id for your submission");
            }
            if (targetVersion.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Please enter a version for your submission");
            }
            if ("current".equals(targetVersion)) {
                targetVersion = "1";
            }
            payload.setOverwriteMerge("0");
            payload.setId(targetId);
            payload.setVersion(targetVersion);
            payload.setName(allParams.getOrDefault("name", ""));
            payload.setDescription(allParams.getOrDefault("description", ""));
        } else {
            String targetCollectionUri = allParams.getOrDefault("collections", "").trim();
            if (targetCollectionUri.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Please select a collection to add to");
            }
            payload.setOverwriteMerge("2");
            payload.setCollectionUri(targetCollectionUri);
        }

        SBOLDocument sourceDoc = downloadService.getSBOLRecursive(sourceUri);
        if (sourceDoc == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Submission not found: " + sourceUri);
        }

        Path tempSbol = Files.createTempFile("sbh-makepublic-", ".xml");
        try {
            try {
                SBOLWriter.write(sourceDoc, tempSbol.toFile());
            } catch (SBOLConversionException e) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                        "Failed to serialize SBOL for publishing: " + e.getMessage());
            }
            payload.setUploadedFilePath(tempSbol.toAbsolutePath().toString());

            collectionService.sanitize(payload);
            sbolService.readSbol(payload, webOfRegistriesMap(),
                    databasePrefix + "user/" + userId,
                    resolveUserAuthToken(payload));
            upload(payload);
        } finally {
            Files.deleteIfExists(tempSbol);
        }

        if (!"current".equals(version)) {
            String sourceUriPrefix = collectionService.uriPrefixFromCollectionUri(null, sourceUri);
            String sourceGraphUri = sparqlService.resolveGraphUriForTopLevel(sourceUri);
            if (sourceUriPrefix != null) {
                if (ConfigUtil.get("useSBOLExplorer").asBoolean(false)) {
                    notifyExplorerRemoveCollection(sourceUri, sourceUriPrefix);
                }
                deleteCollectionTriples(sourceUri, sourceUriPrefix, sourceGraphUri);
            }
        }

        String modified = Instant.now().truncatedTo(ChronoUnit.SECONDS).toString().replace("Z", "");
        sparqlService.updateCollectionMembership(modified);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/plain; charset=UTF-8"))
                .body("Success");
    }

    // -------------------------------------------------------------------------
    // parse — multipart form fields + temp file + authenticated user context
    // -------------------------------------------------------------------------

    /**
     * Reads form parameters and persists the uploaded file to a temp path.
     * Does not validate business rules.
     */
    private SubmitPayload parse(SubmitPayload payload, MultipartFile file) throws IOException {
        //TODO: why are we creating a temp file here?
        if (file != null && !file.isEmpty()) {
            String suffix = FileUtil.sanitizeFilename(file.getOriginalFilename());
            Path temp = Files.createTempFile("sbh-submit-", "-" + suffix);
            file.transferTo(temp);
            payload.setUploadedFilePath(temp.toAbsolutePath().toString());
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        payload.setCreatedBy(auth.getName());
        payload.setCitationPubmedIds(citationService.parseCitationPubmedIds(payload.getCitations()));
        return payload;
    }

    private String resolveUserAuthToken(SubmitPayload payload) {
        // TODO: create authService
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

    // -------------------------------------------------------------------------
    // prepare — delete existing triples before overwrite (overwrite_merge == 1)
    // -------------------------------------------------------------------------

    /**
     * Path-suffixed removeCollection (SBH1 {@code actions/removeCollection}).
     */
    public ResponseEntity<String> removeCollection(
            boolean isPublic, String userId, String collectionId, String displayId, String version)
            throws IOException {
        String prefix = ConfigUtil.get("databasePrefix").asText();
        String collectionUri = isPublic
                ? prefix + "public/" + collectionId + "/" + displayId + "/" + version
                : prefix + "user/" + userId + "/" + collectionId + "/" + displayId + "/" + version;

        if (isPublic) {
            var enabled = ConfigUtil.get("removePublicEnabled");
            if (enabled == null || !enabled.asBoolean()) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Removing public submissions is not allowed");
            }
        }

        if (!userService.isOwnedBy(collectionUri)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Not authorized to remove this submission");
        }

        String uriPrefix = collectionService.uriPrefixFromCollectionUri(null, collectionUri);
        if (uriPrefix == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid collection URI");
        }

        if (ConfigUtil.get("useSBOLExplorer").asBoolean(false)) {
            notifyExplorerRemoveCollection(collectionUri, uriPrefix);
        }

        String graphUri = sparqlService.resolveGraphUriForTopLevel(collectionUri);
        deleteCollectionTriples(collectionUri, uriPrefix, graphUri);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/plain; charset=UTF-8"))
                .body("Success");
    }

    /**
     * Overwrite mode: stagger-delete all objects under the collection URI prefix, then remove
     * the collection itself. Mirrors {@code submit.js} after prepareSubmission succeeds.
     */
    private void prepare(SubmitPayload payload) throws IOException {
        if (!"1".equals(payload.getOverwriteMerge())) {
            return;
        }
        String collectionUri = payload.getCollectionUri();
        String uriPrefix = collectionService.uriPrefixFromCollectionUri(payload, collectionUri);
        if (collectionUri == null || uriPrefix == null) {
            return;
        }

        String graphUri = collectionService.graphUriForCollection(collectionUri, payload);
        log.debug("prepare overwrite: removing {}", uriPrefix);
        deleteCollectionTriples(collectionUri, uriPrefix, graphUri);

        if (ConfigUtil.get("useSBOLExplorer").asBoolean(false)) {
            notifyExplorerRemoveCollection(collectionUri, uriPrefix);
        }
    }

    private void deleteCollectionTriples(String collectionUri, String uriPrefix, String graphUri)
            throws IOException {
        sparqlService.deleteCollection(Map.of("collection", collectionUri, "uriPrefix", uriPrefix), graphUri);
        sparqlService.delete(Map.of("uri", collectionUri), graphUri);
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
        String graphUri = collectionService.graphUriForCollection(payload.getCollectionUri(), payload);
        String resultPath = payload.getResultFilePath();
        if (resultPath == null || resultPath.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No prepared SBOL file to upload.");
        }

        log.debug("upload: posting RDF to graph {}", graphUri);
        sparqlService.uploadGraphStore(graphUri, Path.of(resultPath));

        if (!payload.getAttachmentFiles().isEmpty()) {
            attachmentService.uploadAttachments(payload, graphUri);
        }

        FileUtil.cleanupSubmitTemp(payload);
    }

    // -------------------------------------------------------------------------
    // response / small helpers
    // -------------------------------------------------------------------------

    private ResponseEntity<String> successResponse() {
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/plain; charset=UTF-8"))
                .body("Successfully uploaded");
    }
}