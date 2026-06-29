package com.synbiohub.sbh3.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.synbiohub.sbh3.dto.submit.PrepareSubmissionResult;
import com.synbiohub.sbh3.dto.submit.SanitizedSubmitPayload;
import com.synbiohub.sbh3.dto.submit.SubmitCreatedBy;
import com.synbiohub.sbh3.utils.ConfigUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.HashMap;
import java.util.Map;

/**
 * Submit step 6 after successful {@link PrepareSubmissionService}: overwrite delete, graph upload,
 * attachment handling, temp cleanup (legacy {@code submit.js} tail).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SubmitPersistService {

    private final VirtuosoAuthSparqlService sparql;
    private final GraphStoreUploadService graphStoreUpload;
    private final SubmitUploadStorageService uploadStorage;
    private final SubmitAttachmentService attachments;
    private final SearchService searchService;
    private final RestTemplate restTemplate = new RestTemplate();

    public void persistAfterPrepare(SanitizedSubmitPayload submission, PrepareSubmissionResult prepare)
            throws IOException, InterruptedException {
        SubmitCreatedBy createdBy = submission.getCreatedBy();
        String graphUri = searchService.resolveNamedGraphForSubmit(createdBy);
        String collectionUri = submission.getCollectionUri();
        String overwriteMerge = submission.getOverwriteMerge() != null ? submission.getOverwriteMerge().trim() : "";

        if ("1".equals(overwriteMerge)) {
            overwriteDeleteCollection(collectionUri, graphUri);
        }

        graphStoreUpload.uploadRdfFile(
                graphUri,
                prepare.getResultFilename(),
                "application/rdf+xml");

        processAttachments(submission, prepare, graphUri);

        cleanupTempPaths(prepare.getExtractDirPath(), prepare.getResultFilename());
    }

    private void overwriteDeleteCollection(String collectionUri, String graphUri) throws IOException {
        String uriPrefix = collectionUriPrefixForDelete(collectionUri);
        log.info("Overwrite delete for collection {} prefix {}", collectionUri, uriPrefix);

        String removeCollection = VirtuosoAuthSparqlService.loadTemplate(
                "src/main/java/com/synbiohub/sbh3/sparql/removeCollection.sparql",
                Map.of("collection", collectionUri, "uriPrefix", uriPrefix));
        sparql.deleteStaggered(removeCollection, graphUri);

        String removeRoot = VirtuosoAuthSparqlService.loadTemplate(
                "src/main/java/com/synbiohub/sbh3/sparql/remove.sparql",
                Map.of("uri", collectionUri));
        sparql.deleteStaggered(removeRoot, graphUri);

        if (ConfigUtil.get("useSBOLExplorer").asBoolean(false)) {
            notifyExplorerRemoveCollection(collectionUri, uriPrefix);
        }
    }

    /** Legacy: strip version and collectionId segments to get the id-level prefix ending with {@code /}. */
    static String collectionUriPrefixForDelete(String collectionUri) {
        int end = collectionUri.lastIndexOf('/');
        if (end <= 0) {
            return collectionUri;
        }
        String withoutVersion = collectionUri.substring(0, end);
        int end2 = withoutVersion.lastIndexOf('/');
        if (end2 <= 0) {
            return collectionUri;
        }
        return withoutVersion.substring(0, end2 + 1);
    }

    private void notifyExplorerRemoveCollection(String subject, String uriPrefix) throws IOException {
        String base = ConfigUtil.get("SBOLExplorerEndpoint").asText().trim();
        String url = UriComponentsBuilder.fromHttpUrl(base.endsWith("/") ? base : base + "/")
                .path("incrementalremovecollection")
                .queryParam("subject", subject)
                .queryParam("uriPrefix", uriPrefix)
                .toUriString();
        try {
            restTemplate.getForEntity(url, String.class);
        } catch (Exception e) {
            log.warn("SBOL Explorer incrementalremovecollection failed: {}", e.getMessage());
        }
    }

    private void processAttachments(
            SanitizedSubmitPayload submission,
            PrepareSubmissionResult prepare,
            String graphUri) throws IOException {
        String dbPrefix = ConfigUtil.get("databasePrefix").asText();
        String encUser = SubmitSanitizationService.encodeURIComponent(submission.getCreatedBy().getUsername());
        String collectionId = submission.getCollectionId();
        String idSegment = collectionId != null ? collectionId.replace("_collection", "") : submission.getId();
        String baseUri = dbPrefix + "user/" + encUser + "/" + idSegment;
        String collectionUri = baseUri + "/" + collectionId + "/" + submission.getVersion();

        String sourceQuery = VirtuosoAuthSparqlService.loadTemplate(
                "src/main/java/com/synbiohub/sbh3/sparql/GetAttachmentSourceFromTopLevel.sparql",
                Map.of("uri", collectionUri));
        JsonNode rows = sparql.queryJson(sourceQuery, graphUri);
        Map<String, String> sources = new HashMap<>();
        if (rows.isArray()) {
            for (JsonNode row : rows) {
                String source = row.path("source").asText("");
                String attachment = row.path("attachment").asText("");
                if (!source.isEmpty() && !attachment.isEmpty()) {
                    sources.put(source, attachment);
                }
            }
        }

        Map<String, String> attachmentFiles = prepare.getAttachmentFiles();
        if (attachmentFiles == null || attachmentFiles.isEmpty()) {
            return;
        }

        for (Map.Entry<String, String> entry : attachmentFiles.entrySet()) {
            String filePath = entry.getKey();
            String format = entry.getValue() != null ? entry.getValue() : "";
            if (format.toLowerCase().contains("sbol")) {
                continue;
            }
            Path path = Path.of(filePath);
            if (!Files.isRegularFile(path)) {
                continue;
            }
            SubmitUploadStorageService.UploadInfo info = uploadStorage.createUploadFromFile(path);
            String basename = path.getFileName().toString();
            String fileKey = "file:" + basename;

            if (sources.containsKey(fileKey)) {
                attachments.updateAttachment(graphUri, sources.get(fileKey), info.getHash(), info.getSize());
                continue;
            }

            String attachmentUri = attachments.addAttachmentToTopLevel(
                    graphUri,
                    baseUri,
                    collectionUri,
                    basename,
                    info.getHash(),
                    info.getSize(),
                    format.isEmpty() ? info.getMime() : format,
                    submission.getCreatedBy().getUsername());

            attachments.replaceAttachmentSourceUri(graphUri, fileKey, attachmentUri);
        }
    }

    private static void cleanupTempPaths(String extractDirPath, String resultFilename) throws IOException {
        if (extractDirPath != null && !extractDirPath.isBlank()) {
            Path dir = Path.of(extractDirPath);
            if (Files.isDirectory(dir)) {
                try (var walk = Files.walk(dir)) {
                    walk.sorted(Comparator.reverseOrder()).forEach(p -> {
                        try {
                            Files.deleteIfExists(p);
                        } catch (IOException ignored) {
                        }
                    });
                }
            }
        }
        if (resultFilename != null && !resultFilename.isBlank()) {
            Files.deleteIfExists(Path.of(resultFilename));
        }
    }
}
