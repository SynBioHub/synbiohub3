package com.synbiohub.sbh3.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.synbiohub.sbh3.dao.SparqlService;
import com.synbiohub.sbh3.submit.SubmitPayload;
import com.synbiohub.sbh3.utils.ConfigUtil;
import com.synbiohub.sbh3.utils.FileUtil;
import com.synbiohub.sbh3.utils.StringUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URLEncoder;
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

@Service
@RequiredArgsConstructor
public class AttachmentService {

    private final SparqlService sparqlService;
    private final SbolService sbolService;

    static final String UNKNOWN_ATTACHMENT_TYPE = "http://wiki.synbiohub.org/wiki/Terms/synbiohub#unknownAttachment";

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