package com.synbiohub.sbh3.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.synbiohub.sbh3.dao.SparqlService;
import com.synbiohub.sbh3.security.model.AuthCodes;
import com.synbiohub.sbh3.security.repo.AuthRepository;
import com.synbiohub.sbh3.submit.SubmitPayload;
import com.synbiohub.sbh3.submit.SubmitPluginService;
import com.synbiohub.sbh3.utils.ConfigUtil;
import com.synbiohub.sbh3.utils.FileUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.sbolstandard.core2.SBOLValidationException;
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

    private final UserService userService;
    private final AuthRepository authRepository;
    private final SearchService searchService;
    private final SubmitPluginService submitPluginService;
    private final CitationService citationService;
    private final CollectionService collectionService;
    private final SbolService sbolService;
    private final SparqlService sparqlService;
    private final AttachmentService attachmentService;
    private final ObjectMapper objectMapper;

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
        Map<String, String> templateParams = Map.of(
                "collection", collectionUri,
                "uriPrefix", uriPrefix);

        log.debug("prepare overwrite: removing {}", uriPrefix);
        sparqlService.deleteCollection(templateParams, graphUri);
        sparqlService.delete(Map.of("uri", collectionUri), graphUri);

        if (ConfigUtil.get("useSBOLExplorer").asBoolean(false)) {
            notifyExplorerRemoveCollection(collectionUri, uriPrefix);
        }
    }

    private void notifyExplorerRemoveCollection(String collectionUri, String uriPrefix) throws IOException {
        // TODO: refactor this method in the future, currently not being called
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
                .body("Submission successful");
    }
}