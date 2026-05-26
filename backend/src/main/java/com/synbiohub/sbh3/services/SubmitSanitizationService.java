package com.synbiohub.sbh3.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.synbiohub.sbh3.dto.submit.ParsedSubmitPayload;
import com.synbiohub.sbh3.dto.submit.SanitizedSubmitPayload;
import com.synbiohub.sbh3.dto.submit.SubmitUnauthorizedException;
import com.synbiohub.sbh3.utils.ConfigUtil;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Submit pipeline step 2: {@code sanitizeSubmission} — validate and normalize the parsed payload before later steps.
 */
@Service
public class SubmitSanitizationService {

    private static final Pattern ID_PATTERN = Pattern.compile("^[a-zA-Z_][a-zA-Z0-9_]*$");
    private static final Pattern VERSION_PATTERN = Pattern.compile("^[0-9][a-zA-Z0-9_.-]*$");
    /** Legacy {@code citationRegEx}: comma-separated PubMed IDs, digits only (validated on trimmed full string). */
    private static final Pattern CITATIONS_PATTERN = Pattern.compile("^[0-9]+(,[0-9]*)*$");

    /**
     * @param databasePrefixOverride if non-null, used instead of {@link ConfigUtil} (unit tests).
     */
    public SanitizedSubmitPayload sanitizeSubmission(ParsedSubmitPayload payload, String databasePrefixOverride)
            throws IOException {
        if (payload == null || payload.getCreatedBy() == null) {
            throw new SubmitUnauthorizedException("Must be logged in to submit");
        }

        String om = payload.getOverwriteMerge() != null ? payload.getOverwriteMerge().trim() : "";
        if ("0".equals(om) || "1".equals(om)) {
            return sanitizeNewCollection(payload, databasePrefixOverride);
        }
        return sanitizeOverwriteOrMerge(payload, databasePrefixOverride);
    }

    public SanitizedSubmitPayload sanitizeSubmission(ParsedSubmitPayload payload) throws IOException {
        return sanitizeSubmission(payload, null);
    }

    private static SanitizedSubmitPayload sanitizeNewCollection(ParsedSubmitPayload payload, String databasePrefixOverride)
            throws IOException {
        String id = trimToEmpty(payload.getId());
        String version = trimToEmpty(payload.getVersion());
        String name = trimToEmpty(payload.getName());
        String description = trimToEmpty(payload.getDescription());

        if (id.isEmpty()) {
            throw new IllegalArgumentException("Please enter an id");
        }
        if (!ID_PATTERN.matcher(id).matches()) {
            throw new IllegalArgumentException("Please enter a valid id");
        }
        if (version.isEmpty()) {
            throw new IllegalArgumentException("Please enter a version");
        }
        if (!VERSION_PATTERN.matcher(version).matches()) {
            throw new IllegalArgumentException("Please enter a valid version");
        }
        if (name.isEmpty()) {
            throw new IllegalArgumentException("Please enter a name");
        }
        if (description.isEmpty()) {
            throw new IllegalArgumentException("Please enter a description");
        }

        String dbPrefix = databasePrefixOverride != null
                ? normalizeDbPrefix(databasePrefixOverride)
                : loadDatabasePrefix();
        if (dbPrefix.isEmpty()) {
            throw new IllegalArgumentException("Server configuration is missing databasePrefix");
        }

        String username = payload.getCreatedBy().getUsername();
        if (username == null || username.isBlank()) {
            throw new SubmitUnauthorizedException("Must be logged in to submit");
        }

        String encUser = encodeURIComponent(username.trim());
        String collectionId = id + "_collection";
        String collectionUri = dbPrefix + "user/" + encUser + "/" + id + "/" + collectionId + "/" + version;

        String citationsTrimmed = trimCitationsField(payload.getCitations());
        List<Integer> citationArray = parseCitationArray(citationsTrimmed);

        String overwriteMerge = payload.getOverwriteMerge() != null ? payload.getOverwriteMerge().trim() : "";
        ParsedSubmitPayload normalized = ParsedSubmitPayload.builder()
                .id(id)
                .name(name)
                .description(description)
                .version(version)
                .citations(citationsTrimmed)
                .overwriteMerge(overwriteMerge)
                .plugin(payload.getPlugin())
                .collectionUri(collectionUri)
                .uploadedFilePath(ensureUploadPathForDownstream(payload.getUploadedFilePath()))
                .createdBy(payload.getCreatedBy())
                .build();

        return SanitizedSubmitPayload.fromParsed(normalized, collectionUri, collectionId, citationArray);
    }

    /**
     * overwriteMerge {@code "2"} or {@code "3"}: existing-collection path (legacy submit.js branch B).
     * <ul>
     *   <li>B1 — {@code collectionUri} empty: require {@code id} and {@code version} (and username) or error;
     *       else rebuild URI like new-collection layout.</li>
     *   <li>B2 — {@code collectionUri} set: strip {@code databasePrefix + user/{encodeURIComponent(username)}/},
     *       parse {@code id}, {@code collectionId} = {@code id + "_collection"}, {@code version} from remaining path.</li>
     * </ul>
     */
    private static SanitizedSubmitPayload sanitizeOverwriteOrMerge(ParsedSubmitPayload payload, String databasePrefixOverride)
            throws IOException {
        String dbPrefix = databasePrefixOverride != null
                ? normalizeDbPrefix(databasePrefixOverride)
                : loadDatabasePrefix();
        if (dbPrefix.isEmpty()) {
            throw new IllegalArgumentException("Server configuration is missing databasePrefix");
        }

        String username = payload.getCreatedBy().getUsername();
        if (username == null || username.isBlank()) {
            throw new SubmitUnauthorizedException("Must be logged in to submit");
        }
        String encUser = encodeURIComponent(username.trim());
        String prefixHead = dbPrefix + "user/" + encUser + "/";

        String incomingUri = trimToEmpty(payload.getCollectionUri());

        final String collectionUri;
        final String id;
        final String version;
        final String collectionId;

        if (incomingUri.isEmpty()) {
            id = trimToEmpty(payload.getId());
            version = trimToEmpty(payload.getVersion());
            if (id.isEmpty() || version.isEmpty()) {
                throw new IllegalArgumentException("Please select a collection to add to");
            }
            if (!ID_PATTERN.matcher(id).matches()) {
                throw new IllegalArgumentException("Please enter a valid id");
            }
            if (!VERSION_PATTERN.matcher(version).matches()) {
                throw new IllegalArgumentException("Please enter a valid version");
            }
            collectionId = id + "_collection";
            collectionUri = prefixHead + id + "/" + collectionId + "/" + version;
        } else {
            if (!incomingUri.startsWith(prefixHead)) {
                throw new IllegalArgumentException("Invalid collection URI");
            }
            String tempStr = incomingUri.substring(prefixHead.length());
            int firstSlash = tempStr.indexOf('/');
            if (firstSlash <= 0 || firstSlash >= tempStr.length() - 1) {
                throw new IllegalArgumentException("Invalid collection URI");
            }
            id = tempStr.substring(0, firstSlash);
            if (!ID_PATTERN.matcher(id).matches()) {
                throw new IllegalArgumentException("Invalid collection URI");
            }
            collectionId = id + "_collection";
            String afterId = tempStr.substring(firstSlash + 1);
            String expectedHead = collectionId + "/";
            if (!afterId.startsWith(expectedHead)) {
                throw new IllegalArgumentException("Invalid collection URI");
            }
            version = afterId.substring(expectedHead.length());
            if (version.isEmpty() || !VERSION_PATTERN.matcher(version).matches()) {
                throw new IllegalArgumentException("Invalid collection URI");
            }
            collectionUri = incomingUri;
        }

        String om = payload.getOverwriteMerge() != null ? payload.getOverwriteMerge().trim() : "";
        String citationsTrimmed = trimCitationsField(payload.getCitations());
        List<Integer> citationArray = parseCitationArray(citationsTrimmed);

        ParsedSubmitPayload normalized = ParsedSubmitPayload.builder()
                .id(id)
                .name(trimToEmpty(payload.getName()))
                .description(trimToEmpty(payload.getDescription()))
                .version(version)
                .citations(citationsTrimmed)
                .overwriteMerge(om)
                .plugin(payload.getPlugin())
                .collectionUri(collectionUri)
                .uploadedFilePath(ensureUploadPathForDownstream(payload.getUploadedFilePath()))
                .createdBy(payload.getCreatedBy())
                .build();

        return SanitizedSubmitPayload.fromParsed(normalized, collectionUri, collectionId, citationArray);
    }

    /**
     * Legacy submit.js: if no filename, {@code tmp.fileSync().name} so downstream always has a filesystem path.
     * Creates an empty temp file; {@link java.io.File#deleteOnExit()} for JVM cleanup.
     */
    private static String ensureUploadPathForDownstream(String uploadedFilePath) throws IOException {
        String p = trimToEmpty(uploadedFilePath);
        if (!p.isEmpty()) {
            return p;
        }
        Path tmp = Files.createTempFile("sbh-submit-empty-", ".tmp");
        tmp.toFile().deleteOnExit();
        return tmp.toAbsolutePath().normalize().toString();
    }

    private static String trimToEmpty(String s) {
        return s == null ? "" : s.trim();
    }

    private static String trimCitationsField(String citations) {
        return citations == null ? "" : citations.trim();
    }

    /**
     * Optional citations: blank → {@link List#of()}; else whole trimmed string must match legacy {@code citationRegEx}.
     */
    private static List<Integer> parseCitationArray(String trimmedCitations) {
        if (trimmedCitations.isEmpty()) {
            return List.of();
        }
        if (!CITATIONS_PATTERN.matcher(trimmedCitations).matches()) {
            throw new IllegalArgumentException("Please enter valid PubMed citation numbers");
        }
        List<Integer> out = new ArrayList<>();
        for (String part : trimmedCitations.split(",")) {
            String t = part.trim();
            if (!t.isEmpty()) {
                try {
                    out.add(Integer.parseInt(t));
                } catch (NumberFormatException e) {
                    throw new IllegalArgumentException("Please enter valid PubMed citation numbers");
                }
            }
        }
        return List.copyOf(out);
    }

    private static String loadDatabasePrefix() throws IOException {
        JsonNode n = ConfigUtil.get("databasePrefix");
        if (n == null || n.isNull()) {
            return "";
        }
        return normalizeDbPrefix(n.asText(""));
    }

    private static String normalizeDbPrefix(String prefix) {
        String s = prefix == null ? "" : prefix.trim();
        if (s.isEmpty()) {
            return "";
        }
        return s.endsWith("/") ? s : s + "/";
    }

    /** encodeURIComponent-style for path segments (UTF-8, spaces as {@code %20}). */
    public static String encodeURIComponent(String s) {
        return URLEncoder.encode(s, StandardCharsets.UTF_8).replace("+", "%20");
    }
}
