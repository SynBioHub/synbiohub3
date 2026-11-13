package com.synbiohub.sbh3.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.synbiohub.sbh3.dao.SparqlService;
import com.synbiohub.sbh3.submit.SubmitPayload;
import com.synbiohub.sbh3.utils.ConfigUtil;
import com.synbiohub.sbh3.utils.FileUtil;
import com.synbiohub.sbh3.utils.StringUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.net.URLEncoder;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.zip.GZIPOutputStream;
import java.util.zip.GZIPInputStream;
import org.springframework.security.authentication.AnonymousAuthenticationToken;

@Service
@RequiredArgsConstructor
public class AttachmentService {

    private final SparqlService sparqlService;
    private final SbolService sbolService;
    private final UserService userService;
    private final CollectionService collectionService;

    static final String UNKNOWN_ATTACHMENT_TYPE = "http://wiki.synbiohub.org/wiki/Terms/synbiohub#unknownAttachment";

    /** Detaches from this object only; other objects may reference the same attachment or stored bytes. */
    public void removeAttachment(String targetUri, String attachmentUri) throws IOException {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sign in to remove an attachment.");
        }
        for (String uri : new String[]{targetUri, attachmentUri}) {
            try {
                if (uri == null) throw new IllegalArgumentException();
                URI.create(uri);
            } catch (IllegalArgumentException e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid attachment URI.");
            }
            if (!uri.startsWith(ConfigUtil.get("databasePrefix").asText() + "public/")
                    && !uri.startsWith(ConfigUtil.get("graphPrefix").asText() + "user/")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Attachment must belong to this registry.");
            }
        }
        if (!Boolean.TRUE.equals(userService.isOwnedBy(targetUri))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not own this attachment target.");
        }
        String graph = sparqlService.resolveGraphUriForTopLevel(targetUri);
        String prefixes = "PREFIX sbol: <http://sbols.org/v2#> "
                + "PREFIX sbh: <http://wiki.synbiohub.org/wiki/Terms/synbiohub#> ";
        String link = "<" + targetUri + "> sbol:attachment|sbh:attachment <" + attachmentUri + "> . ";
        String result = sparqlService.read(sparqlService.sparqlQueryUrl(), graph,
                prefixes + "ASK { " + link + " }");
        if (!new ObjectMapper().readTree(result).path("boolean").asBoolean(false)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "This attachment is no longer attached to this object.");
        }
        String triple = "<" + targetUri + "> ?relationship <" + attachmentUri + "> . ";
        sparqlService.update(prefixes + "DELETE { GRAPH <" + graph + "> { " + triple + "} } "
                + "WHERE { GRAPH <" + graph + "> { " + link + triple
                + "VALUES ?relationship { sbol:attachment sbh:attachment sbol:member } } }", graph, false);
    }

    /** Returns the original bytes, not the gzip representation used for storage. */
    public AttachmentDownload downloadFile(String attachmentUri) throws IOException {
        try {
            URI.create(attachmentUri);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid attachment URI.");
        }
        boolean isPublic = attachmentUri.startsWith(ConfigUtil.get("databasePrefix").asText() + "public/");
        if (!isPublic && !attachmentUri.startsWith(ConfigUtil.get("graphPrefix").asText() + "user/")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Attachment must belong to this registry.");
        }
        String graph = sparqlService.resolveGraphUriForTopLevel(attachmentUri);
        ObjectMapper mapper = new ObjectMapper();
        if (!isPublic) {
            var auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sign in to download this attachment.");
            }
            String viewer = ConfigUtil.get("graphPrefix").asText() + "user/"
                    + URLEncoder.encode(auth.getName(), StandardCharsets.UTF_8);
            String accessQuery = "PREFIX sbh: <http://wiki.synbiohub.org/wiki/Terms/synbiohub#> "
                    + "PREFIX sbol: <http://sbols.org/v2#> ASK { "
                    + "{ <" + attachmentUri + "> sbh:ownedBy <" + viewer + "> } UNION "
                    + "{ ?parent sbol:attachment <" + attachmentUri + ">; sbh:ownedBy <" + viewer + "> } UNION "
                    + "{ GRAPH <" + viewer + "> { <" + viewer + "> sbh:canView <" + attachmentUri + "> } } UNION "
                    + "{ GRAPH <" + viewer + "> { <" + viewer + "> sbh:canView ?parent } "
                    + "?parent sbol:attachment <" + attachmentUri + "> } }";
            String access = sparqlService.read(sparqlService.sparqlQueryUrl(), graph, accessQuery);
            if (!mapper.readTree(access).path("boolean").asBoolean(false)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot access this attachment.");
            }
        }
        String query = "SELECT ?hash ?name WHERE { <" + attachmentUri
                + "> a <http://sbols.org/v2#Attachment>; <http://sbols.org/v2#hash> ?hash . "
                + "OPTIONAL { <" + attachmentUri + "> <http://purl.org/dc/terms/title> ?name } } LIMIT 1";
        JsonNode rows = mapper.readTree(sparqlService.read(sparqlService.sparqlQueryUrl(), graph, query))
                .path("results").path("bindings");
        if (!rows.isArray() || rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Attachment not found.");
        }
        String hash = rows.get(0).path("hash").path("value").asText("");
        if (!hash.matches("[0-9a-f]{40}")) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Invalid attachment storage metadata.");
        }
        Path stored = uploadPath(hash);
        if (!Files.isRegularFile(stored)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "The stored attachment file is missing.");
        }
        String name = FileUtil.sanitizeFilename(rows.get(0).path("name").path("value").asText("attachment"));
        if (name.isBlank() || name.equals(".") || name.equals("..")) {
            name = "attachment";
        }
        try (GZIPInputStream input = new GZIPInputStream(Files.newInputStream(stored))) {
            return new AttachmentDownload(name, input.readAllBytes());
        }
    }

    public record AttachmentDownload(String filename, byte[] content) {}

    /** Attaches a binary file to an existing object without running design submission/merge. */
    public String attachFile(String targetUri, MultipartFile file) throws IOException {
        try {
            URI.create(targetUri);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid attachment target URI.");
        }
        String databasePrefix = ConfigUtil.get("databasePrefix").asText();
        String graphPrefix = ConfigUtil.get("graphPrefix").asText();
        if (!targetUri.startsWith(databasePrefix + "public/")
                && !targetUri.startsWith(graphPrefix + "user/")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Attachment target must belong to this registry.");
        }
        if (!userService.isOwnedBy(targetUri)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not own this attachment target.");
        }
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Select a non-empty file to attach.");
        }
        String filename = FileUtil.sanitizeFilename(file.getOriginalFilename());
        if (filename.equals(".") || filename.equals("..")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid attachment filename.");
        }
        int versionSlash = targetUri.lastIndexOf('/');
        int identitySlash = targetUri.lastIndexOf('/', versionSlash - 1);
        String baseUri = targetUri.substring(0, identitySlash);
        String graphUri = sparqlService.resolveGraphUriForTopLevel(targetUri);
        String collectionUri = collectionService.collectionExists(targetUri, graphUri) ? targetUri : null;
        String owner = SecurityContextHolder.getContext().getAuthentication().getName();
        Path tempDir = Files.createTempDirectory("sbh-attachment-");
        Path tempFile = tempDir.resolve(filename);
        try {
            file.transferTo(tempFile);
            UploadInfo upload = createAttachmentUpload(tempFile);
            return addAttachmentToTopLevel(graphUri, baseUri, collectionUri, targetUri, filename,
                    upload.hash(), upload.size(), attachmentTypeFromExtension(tempFile), owner);
        } finally {
            Files.deleteIfExists(tempFile);
            Files.deleteIfExists(tempDir);
        }
    }

    // Code associated with submitting attachments
    /**
     * For each non-SBOL attachment: gzip+hash to {@code ./uploads/}, insert or update triples,
     * then rewrite {@code file:filename} placeholders to real attachment URIs.
     */
    public void uploadAttachments(SubmitPayload payload, String graphUri) throws IOException {
        String collectionUri = payload.getCollectionUri();
        String baseUri = attachmentBaseUri(payload);
        Map<String, String> existingSources = sparqlService.loadAttachmentSources(collectionUri, graphUri);

        for (Path attachmentPath : payload.getAttachmentFiles()) {
            String attachmentType = attachmentTypeFromExtension(attachmentPath);
            if (attachmentType.toLowerCase(Locale.ROOT).contains("sbol")) {
                continue;
            }

            AttachmentService.UploadInfo upload = createAttachmentUpload(attachmentPath);
            String filename = attachmentPath.getFileName().toString();
            String fileKey = "file:" + filename; // placeholder source URI from SBOL during readSbol

            if (existingSources.containsKey(fileKey)) {
                sparqlService.updateAttachment(graphUri, existingSources.get(fileKey), upload.hash(), upload.size());
                continue;
            }

            String attachmentUri = addAttachmentToTopLevel(
                    graphUri,
                    baseUri,
                    collectionUri,
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

    /** Inserts attachment triples and links them to the root collection ({@code AttachUpload.sparql}). */
    private String addAttachmentToTopLevel(String graphUri, String baseUri, String collectionUri, String topLevelUri,
                                           String name, String uploadHash, long size, String attachmentType,
                                           String owner) throws IOException {
        String displayId = "attachment_" + UUID.randomUUID().toString().replace("-", "");
        String persistentIdentity = baseUri + "/" + displayId;
        String version = "1";
        String attachmentUri = persistentIdentity + "/" + version;
        String ownedBy = ConfigUtil.get("databasePrefix").asText()
                + "user/" + URLEncoder.encode(owner, StandardCharsets.UTF_8);

        Map<String, String> templateParams = new HashMap<>();
        templateParams.put("collectionMembership", collectionUri == null ? ""
                : "<" + collectionUri + "> sbol:member <" + attachmentUri + "> .");
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
        sparqlService.attachUpload(templateParams, graphUri, false);
        return attachmentUri;
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
    private AttachmentService.UploadInfo createAttachmentUpload(Path file) throws IOException {
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
            return new AttachmentService.UploadInfo(hash, raw.length);
        } catch (NoSuchAlgorithmException e) {
            throw new IOException("SHA-1 not available", e);
        }
    }

    private static Path uploadPath(String hash) {
        return Path.of("uploads", hash.substring(0, 2), hash.substring(2) + ".gz");
    }

    private record UploadInfo(String hash, long size) {}
}
