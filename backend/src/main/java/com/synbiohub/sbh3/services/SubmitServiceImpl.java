package com.synbiohub.sbh3.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.synbiohub.sbh3.dao.SparqlService;
import com.synbiohub.sbh3.repo.SparqlRepository;
import com.synbiohub.sbh3.security.model.AuthCodes;
import com.synbiohub.sbh3.security.repo.AuthRepository;
import com.synbiohub.sbh3.sparql.SPARQLQuery;
import com.synbiohub.sbh3.submit.SubmitPayload;
import com.synbiohub.sbh3.submit.SubmitPluginService;
import com.synbiohub.sbh3.utils.ConfigUtil;
import com.synbiohub.sbh3.utils.FileUtil;
import com.synbiohub.sbh3.utils.StringUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.io.FilenameUtils;
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
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.*;
import java.util.zip.GZIPOutputStream;

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
    private final CollectionService collectionService;
    private final SbolService sbolService;
    private final SparqlService sparqlService;
    private final ObjectMapper objectMapper;

    /**
     * Main submit entry point. Each step mutates {@code payload} in place.
     */
    @Override
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
            String suffix = sanitizeFilename(file.getOriginalFilename());
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
            uploadAttachments(payload, graphUri);
        }

        cleanupSubmitTemp(payload);
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

            sparqlService.uploadAttachment(Map.of(
                    "oldUri", fileKey,
                    "newUri", attachmentUri), graphUri);
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
        String query = new SPARQLQuery(SparqlRepository.GET_ATTACHMENT_SOURCE_SPARQL)
                .loadTemplate(Map.of("uri", collectionUri));
        String raw = searchService.SPARQLQuery(query, graphUri);
        Map<String, String> sources = new HashMap<>();
        JsonNode bindings = objectMapper.readTree(raw).path("results").path("bindings");
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
        templateParams.put("displayId", StringUtil.sparqlStringLiteral(displayId));
        templateParams.put("version", StringUtil.sparqlStringLiteral(version));
        templateParams.put("name", StringUtil.sparqlStringLiteral(name));
        templateParams.put("description", StringUtil.sparqlStringLiteral(""));
        templateParams.put("hash", StringUtil.sparqlStringLiteral(uploadHash));
        templateParams.put("size", StringUtil.sparqlStringLiteral(Long.toString(size)));
        templateParams.put("type", attachmentType);
        templateParams.put("ownedBy", ownedBy);
        String update = new SPARQLQuery(SparqlRepository.ATTACH_UPLOAD_SPARQL).loadTemplate(templateParams);
        sparqlService.update(update, graphUri, false);
        return attachmentUri;
    }

    /** Replaces hash/size on an existing attachment when re-uploading the same {@code file:} source. */
    private void updateAttachment(String graphUri, String attachmentUri, String uploadHash, long size)
            throws IOException {
        String update = new SPARQLQuery(SparqlRepository.UPDATE_ATTACHMENT_SPARQL).loadTemplate(Map.of(
                "attachmentURI", attachmentUri,
                "attachmentSource", attachmentUri + "/download",
                "hash", StringUtil.sparqlStringLiteral(uploadHash),
                "size", StringUtil.sparqlStringLiteral(Long.toString(size))));
        sparqlService.update(update, graphUri, false);
    }

    private String attachmentTypeFromExtension(Path file) throws IOException {
        String ext = FileUtil.fileExtension(file);
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
            String hash = sbolService.sha1Hex(digest.digest(raw));
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

    private static String sanitizeFilename(String name) {
        if (name == null || name.isBlank()) {
            return "upload";
        }
        return FilenameUtils.getName(name).replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}