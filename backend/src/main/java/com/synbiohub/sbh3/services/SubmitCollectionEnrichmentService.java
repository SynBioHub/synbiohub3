package com.synbiohub.sbh3.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.synbiohub.sbh3.dto.submit.ParsedSubmitPayload;
import com.synbiohub.sbh3.dto.submit.SubmitCreatedBy;
import com.synbiohub.sbh3.dto.submit.SubmitRootCollectionMetadata;
import com.synbiohub.sbh3.utils.ConfigUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.Optional;

/**
 * When the UI submits only a root collection URI (legacy {@code rootCollections} field), fill missing
 * {@code id}, {@code name}, {@code description}, and {@code version} from SPARQL before sanitization.
 */
@Service
@RequiredArgsConstructor
public class SubmitCollectionEnrichmentService {

    private final SubmitCollectionLookupService submitCollectionLookupService;

    public ParsedSubmitPayload enrichFromCollectionUri(ParsedSubmitPayload parsed) throws IOException {
        if (parsed == null || parsed.getCreatedBy() == null) {
            return parsed;
        }
        String collectionUri = trimToEmpty(parsed.getCollectionUri());
        if (collectionUri.isEmpty() || !needsEnrichment(parsed)) {
            return parsed;
        }

        Optional<SubmitRootCollectionMetadata> existing =
                submitCollectionLookupService.getRootCollectionMetadataForUri(collectionUri, parsed.getCreatedBy());
        if (existing.isEmpty()) {
            throw new IllegalArgumentException("Invalid collection URI");
        }

        SubmitRootCollectionMetadata meta = existing.get();
        String id = trimToEmpty(parsed.getId());
        String name = trimToEmpty(parsed.getName());
        String description = trimToEmpty(parsed.getDescription());
        String version = trimToEmpty(parsed.getVersion());

        if (id.isEmpty()) {
            id = idFromDisplayId(meta.getDisplayId());
            if (id.isEmpty()) {
                id = parseIdFromUri(collectionUri, parsed.getCreatedBy()).orElse("");
            }
        }
        if (name.isEmpty() && meta.getName() != null) {
            name = meta.getName();
        }
        if (description.isEmpty() && meta.getDescription() != null) {
            description = meta.getDescription();
        }
        if (version.isEmpty()) {
            if (meta.getVersion() != null && !meta.getVersion().isBlank()) {
                version = meta.getVersion();
            } else {
                version = parseVersionFromUri(collectionUri, id, parsed.getCreatedBy()).orElse("");
            }
        }

        return ParsedSubmitPayload.builder()
                .id(id)
                .name(name)
                .description(description)
                .version(version)
                .citations(parsed.getCitations())
                .overwriteMerge(parsed.getOverwriteMerge())
                .plugin(parsed.getPlugin())
                .collectionUri(collectionUri)
                .uploadedFilePath(parsed.getUploadedFilePath())
                .createdBy(parsed.getCreatedBy())
                .build();
    }

    private static boolean needsEnrichment(ParsedSubmitPayload parsed) {
        return trimToEmpty(parsed.getId()).isEmpty()
                || trimToEmpty(parsed.getName()).isEmpty()
                || trimToEmpty(parsed.getDescription()).isEmpty()
                || trimToEmpty(parsed.getVersion()).isEmpty();
    }

    private static String idFromDisplayId(String displayId) {
        if (displayId == null || displayId.isBlank()) {
            return "";
        }
        String marker = "_collection";
        int i = displayId.indexOf(marker);
        if (i < 0) {
            return displayId;
        }
        return displayId.substring(0, i);
    }

    private static Optional<String> parseIdFromUri(String collectionUri, SubmitCreatedBy createdBy)
            throws IOException {
        return parseUriTail(collectionUri, createdBy).map(t -> t.id);
    }

    private static Optional<String> parseVersionFromUri(String collectionUri, String id, SubmitCreatedBy createdBy)
            throws IOException {
        Optional<UriTail> tail = parseUriTail(collectionUri, createdBy);
        if (tail.isEmpty()) {
            return Optional.empty();
        }
        UriTail t = tail.get();
        if (!t.id.equals(id)) {
            return Optional.empty();
        }
        return Optional.of(t.version);
    }

    private static Optional<UriTail> parseUriTail(String collectionUri, SubmitCreatedBy createdBy)
            throws IOException {
        String dbPrefix = loadDatabasePrefix();
        if (dbPrefix.isEmpty() || createdBy.getUsername() == null || createdBy.getUsername().isBlank()) {
            return Optional.empty();
        }
        String encUser = SubmitSanitizationService.encodeURIComponent(createdBy.getUsername().trim());
        String prefixHead = dbPrefix + "user/" + encUser + "/";
        if (!collectionUri.startsWith(prefixHead)) {
            return Optional.empty();
        }
        String tempStr = collectionUri.substring(prefixHead.length());
        int firstSlash = tempStr.indexOf('/');
        if (firstSlash <= 0 || firstSlash >= tempStr.length() - 1) {
            return Optional.empty();
        }
        String id = tempStr.substring(0, firstSlash);
        String collectionId = id + "_collection";
        String afterId = tempStr.substring(firstSlash + 1);
        String expectedHead = collectionId + "/";
        if (!afterId.startsWith(expectedHead)) {
            return Optional.empty();
        }
        String version = afterId.substring(expectedHead.length());
        if (version.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(new UriTail(id, version));
    }

    private static String loadDatabasePrefix() throws IOException {
        JsonNode n = ConfigUtil.get("databasePrefix");
        if (n == null || n.isNull()) {
            return "";
        }
        String s = n.asText("").trim();
        if (s.isEmpty()) {
            return "";
        }
        return s.endsWith("/") ? s : s + "/";
    }

    private static String trimToEmpty(String s) {
        return s == null ? "" : s.trim();
    }

    private record UriTail(String id, String version) {}
}
