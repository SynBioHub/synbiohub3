package com.synbiohub.sbh3.services;

import com.synbiohub.sbh3.utils.ConfigUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * RDF attachment triples for non-SBOL files in a submission (legacy {@code attachments.js}).
 */
@Service
@RequiredArgsConstructor
public class SubmitAttachmentService {

    private final VirtuosoAuthSparqlService sparql;

    public String addAttachmentToTopLevel(
            String graphUri,
            String baseUri,
            String topLevelUri,
            String name,
            String uploadHash,
            long size,
            String attachmentType,
            String ownerUsername) throws IOException {
        String displayId = "attachment_" + UUID.randomUUID().toString().replace("-", "");
        String persistentIdentity = baseUri + "/" + displayId;
        String version = "1";
        String attachmentUri = persistentIdentity + "/" + version;
        String idTail = baseUri.substring(baseUri.lastIndexOf('/'));
        String collectionUri = baseUri + idTail + "_collection/" + version;
        String ownedBy = ConfigUtil.get("databasePrefix").asText() + "user/"
                + SubmitSanitizationService.encodeURIComponent(ownerUsername);

        String query = VirtuosoAuthSparqlService.loadTemplate(
                "src/main/java/com/synbiohub/sbh3/sparql/AttachUpload.sparql",
                attachUploadArgs(collectionUri, topLevelUri, attachmentUri, persistentIdentity,
                        displayId, version, name, uploadHash, size, attachmentType, ownedBy));
        sparql.updateQuery(query, graphUri);
        return attachmentUri;
    }

    private static Map<String, String> attachUploadArgs(
            String collectionUri,
            String topLevelUri,
            String attachmentUri,
            String persistentIdentity,
            String displayId,
            String version,
            String name,
            String uploadHash,
            long size,
            String attachmentType,
            String ownedBy) {
        Map<String, String> args = new HashMap<>();
        args.put("collectionUri", collectionUri);
        args.put("topLevel", topLevelUri);
        args.put("attachmentURI", attachmentUri);
        args.put("attachmentSource", attachmentUri + "/download");
        args.put("persistentIdentity", persistentIdentity);
        args.put("displayId", VirtuosoAuthSparqlService.sparqlStringLiteral(displayId));
        args.put("version", VirtuosoAuthSparqlService.sparqlStringLiteral(version));
        args.put("name", VirtuosoAuthSparqlService.sparqlStringLiteral(name));
        args.put("description", VirtuosoAuthSparqlService.sparqlStringLiteral(""));
        args.put("hash", VirtuosoAuthSparqlService.sparqlStringLiteral(uploadHash));
        args.put("size", VirtuosoAuthSparqlService.sparqlStringLiteral(Long.toString(size)));
        args.put("type", attachmentType);
        args.put("ownedBy", ownedBy);
        return args;
    }

    public void updateAttachment(String graphUri, String attachmentUri, String uploadHash, long size) throws IOException {
        String query = VirtuosoAuthSparqlService.loadTemplate(
                "src/main/java/com/synbiohub/sbh3/sparql/UpdateAttachment.sparql",
                Map.of(
                        "attachmentURI", attachmentUri,
                        "attachmentSource", attachmentUri + "/download",
                        "hash", VirtuosoAuthSparqlService.sparqlStringLiteral(uploadHash),
                        "size", VirtuosoAuthSparqlService.sparqlStringLiteral(Long.toString(size))));
        sparql.updateQuery(query, graphUri);
    }

    public void replaceAttachmentSourceUri(String graphUri, String oldUri, String newUri) throws IOException {
        String query = VirtuosoAuthSparqlService.loadTemplate(
                "src/main/java/com/synbiohub/sbh3/sparql/AttachmentUpdate.sparql",
                Map.of("oldUri", oldUri, "newUri", newUri));
        sparql.updateQuery(query, graphUri);
    }
}
