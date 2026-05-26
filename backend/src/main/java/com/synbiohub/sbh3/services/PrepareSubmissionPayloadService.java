package com.synbiohub.sbh3.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.synbiohub.sbh3.dto.submit.SanitizedSubmitPayload;
import com.synbiohub.sbh3.utils.ConfigUtil;
import org.springframework.stereotype.Service;

import java.io.IOException;

/**
 * Builds the JSON object {@code PrepareSubmissionJob} / {@code prepareSubmission} expects: instance config
 * defaults plus fields derived from {@link SanitizedSubmitPayload}, then deep-merge caller overrides (caller wins).
 */
@Service
public class PrepareSubmissionPayloadService {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    /**
     * @param callerOverrides optional JSON object; merged on top so any key can override defaults (legacy Xtend rule)
     * @param authorizationHeader raw {@code Authorization} header for registry callbacks, or null → {@code user} is ""
     */
    public JsonNode buildPrepareSubmissionJson(
            SanitizedSubmitPayload sanitized,
            JsonNode callerOverrides,
            String authorizationHeader) throws IOException {
        ObjectNode base = MAPPER.createObjectNode();
        String dbPrefix = normalizeDatabasePrefix(ConfigUtil.get("databasePrefix"));
        String username = sanitized.getCreatedBy() != null && sanitized.getCreatedBy().getUsername() != null
                ? sanitized.getCreatedBy().getUsername().trim()
                : "";
        String encUser = SubmitSanitizationService.encodeURIComponent(username);
        String id = sanitized.getId() != null ? sanitized.getId() : "";
        String collectionId = sanitized.getCollectionId() != null ? sanitized.getCollectionId() : "";
        String version = sanitized.getVersion() != null ? sanitized.getVersion() : "";

        base.put("sbolFilename", sanitized.getUploadedFilePath() != null ? sanitized.getUploadedFilePath() : "");
        base.put("forceSubmit", true);
        base.put("databasePrefix", dbPrefix);
        base.put("requireComplete", configBoolean("requireComplete", true));
        base.put("requireCompliant", configBoolean("requireCompliant", true));
        base.put("enforceBestPractices", resolveEnforceBestPractices());
        base.set("webOfRegistries", copyWebOfRegistries());
        base.put("shareLinkSalt", configText("shareLinkSalt", ""));
        base.put("useSBOLExplorer", configBoolean("useSBOLExplorer", false));
        base.put("SBOLExplorerEndpoint", configText("SBOLExplorerEndpoint", ""));

        base.put("uriPrefix", dbPrefix + "user/" + encUser + "/" + id + "/");
        base.put("rootCollectionIdentity", dbPrefix + "user/" + encUser + "/" + id + "/" + collectionId + "/" + version);
        base.put("ownedByURI", dbPrefix + "user/" + username);
        String creator = sanitized.getCreatedBy() != null && sanitized.getCreatedBy().getFullName() != null
                ? sanitized.getCreatedBy().getFullName()
                : "";
        base.put("creatorName", creator);

        ArrayNode pm = MAPPER.createArrayNode();
        if (sanitized.getCitationArray() != null) {
            for (Integer c : sanitized.getCitationArray()) {
                if (c != null) {
                    pm.add(c);
                }
            }
        }
        base.set("citationPubmedIDs", pm);

        String om = sanitized.getOverwriteMerge() != null ? sanitized.getOverwriteMerge().trim() : "";
        base.put("overwrite_merge", om);
        base.set("collectionChoices", MAPPER.createArrayNode());
        base.put("user", registryUserToken(authorizationHeader));

        base.put("id", id);
        base.put("name", sanitized.getName() != null ? sanitized.getName() : "");
        base.put("description", sanitized.getDescription() != null ? sanitized.getDescription() : "");
        base.put("version", version);
        base.put("collectionUri", sanitized.getCollectionUri() != null ? sanitized.getCollectionUri() : "");
        base.put("collectionId", collectionId);

        if (callerOverrides != null && callerOverrides.isObject()) {
            deepMerge(base, (ObjectNode) callerOverrides);
        }
        return base;
    }

    private static String registryUserToken(String authorizationHeader) {
        if (authorizationHeader == null || authorizationHeader.isBlank()) {
            return "";
        }
        return authorizationHeader.trim();
    }

    private static void deepMerge(ObjectNode base, ObjectNode over) {
        over.fields().forEachRemaining(e -> {
            String k = e.getKey();
            JsonNode v = e.getValue();
            if (v.isObject() && base.has(k) && base.get(k).isObject()) {
                deepMerge((ObjectNode) base.get(k), (ObjectNode) v);
            } else {
                base.set(k, v.deepCopy());
            }
        });
    }

    private static boolean resolveEnforceBestPractices() throws IOException {
        JsonNode direct = ConfigUtil.get("enforceBestPractices");
        if (direct != null && !direct.isNull()) {
            return direct.asBoolean();
        }
        return configBoolean("requireBestPractice", false);
    }

    private static JsonNode copyWebOfRegistries() throws IOException {
        JsonNode wor = ConfigUtil.get("webOfRegistries");
        if (wor == null || wor.isNull()) {
            return MAPPER.createObjectNode();
        }
        return wor.deepCopy();
    }

    private static boolean configBoolean(String key, boolean defaultValue) throws IOException {
        JsonNode n = ConfigUtil.get(key);
        if (n == null || n.isNull()) {
            return defaultValue;
        }
        return n.asBoolean(defaultValue);
    }

    private static String configText(String key, String defaultValue) throws IOException {
        JsonNode n = ConfigUtil.get(key);
        if (n == null || n.isNull()) {
            return defaultValue;
        }
        return n.asText(defaultValue);
    }

    private static String normalizeDatabasePrefix(JsonNode n) {
        if (n == null || n.isNull()) {
            return "";
        }
        String s = n.asText("").trim();
        if (s.isEmpty()) {
            return "";
        }
        return s.endsWith("/") ? s : s + "/";
    }
}
