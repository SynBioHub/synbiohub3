package com.synbiohub.sbh3.utils;


import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.databind.node.TextNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Component
public class ConfigUtil {

    private static JsonNode json;
    private static JsonNode localjson;
    private static ObjectMapper mapper = new ObjectMapper();

    /**
     * Prefix marking environment variables that override config values. Any key in
     * {@code config.json} (or {@code config.local.json}) can be set this way — e.g.
     * {@code SBH_SPARQL_ENDPOINT} overrides {@code sparqlEndpoint}. Environment variables take
     * precedence over both config files, so settings such as the triplestore location can be
     * supplied at runtime without editing either file. This is what lets the backend run directly
     * via {@code java} against a Virtuoso on {@code localhost} while the committed defaults target
     * the {@code virtuoso} Docker host.
     */
    private static final String ENV_PREFIX = "SBH_";

    /**
     * Overrides keyed by the normalized config key (lower-cased, non-alphanumerics stripped) so
     * that {@code SBH_SPARQL_ENDPOINT} matches {@code sparqlEndpoint} and {@code SBH_USE_SBOL_EXPLORER}
     * matches {@code useSBOLExplorer} regardless of word boundaries. Built once from the process
     * environment, which is immutable at runtime.
     */
    private static Map<String, JsonNode> envOverrides = Map.of();

    private static String normalizeKey(String key) {
        return key == null ? "" : key.toLowerCase().replaceAll("[^a-z0-9]", "");
    }

    /**
     * Builds the {@link #envOverrides} index. Each {@code SBH_}-prefixed variable's value is parsed
     * as JSON so booleans/numbers/objects keep their type (e.g. {@code SBH_USE_SBOL_EXPLORER=true}
     * becomes a boolean, {@code SBH_FETCH_LIMIT=1000} a number). Values that are not valid JSON —
     * a bare URL, for instance — are kept as plain strings.
     */
    private static Map<String, JsonNode> loadEnvOverrides() {
        Map<String, JsonNode> overrides = new HashMap<>();
        for (Map.Entry<String, String> entry : System.getenv().entrySet()) {
            String name = entry.getKey();
            String value = entry.getValue();
            if (name == null || !name.startsWith(ENV_PREFIX) || value == null || value.isBlank()) {
                continue;
            }
            String normalized = normalizeKey(name.substring(ENV_PREFIX.length()));
            if (!normalized.isEmpty()) {
                overrides.put(normalized, parseEnvValue(value));
            }
        }
        return overrides;
    }

    private static JsonNode parseEnvValue(String value) {
        try (JsonParser parser = mapper.getFactory().createParser(value)) {
            JsonNode node = mapper.readTree(parser);
            // Require the whole value to be valid JSON; otherwise (e.g. "150mb", a URL) keep it as text.
            if (node != null && !node.isNull() && !node.isMissingNode() && parser.nextToken() == null) {
                return node;
            }
        } catch (IOException ignored) {
            // not JSON — fall through to a plain string
        }
        return TextNode.valueOf(value);
    }

    private static JsonNode getEnvOverride(String key) {
        JsonNode value = envOverrides.get(normalizeKey(key));
        return (value != null && !value.isNull()) ? value : null;
    }

    public ConfigUtil() {
        localjson = null;
        json = null;
        envOverrides = loadEnvOverrides();
        try {
            json = mapper.readValue(new File("src/main/resources/config.json"), JsonNode.class);
            if (Files.exists(new File("data/config.local.json").toPath())) {
                localjson = mapper.readValue(new File("data/config.local.json"), JsonNode.class);
            } else {
                localjson = mapper.createObjectNode();
            }
        } catch (Exception e) {
            log.error("Error initializing config file!");
        }
    }

    public static JsonNode get(String key) throws IOException {

        if (key.isEmpty())
            return json;

        // Environment variables take precedence over both config files (see ENV_PREFIX).
        JsonNode envValue = getEnvOverride(key);
        if (envValue != null) {
            return envValue;
        }

        try {
            var item = localjson.get(key); // TODO: need to rebuild the object into memory every time it is written to
            if (item != null && !item.isNull()) {
                return item;
            } else {
                return json.get(key);
            }
        } catch (Exception e) {
            log.error("Error initializing config file!");
        }
        return null;
    }

    public static JsonNode getJson() {
        return json;
    }

    public static JsonNode getLocaljson() {
        return localjson;
    }

    public static void set(JsonNode rootNode, String key, Object value) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            ObjectNode objectNode = (ObjectNode) rootNode;
            objectNode.putPOJO(key, value);

            mapper.writerWithDefaultPrettyPrinter().writeValue(new File("data/config.local.json"), objectNode);
        } catch (Exception e) {
            log.error("Error setting key: " + key + " in local config.");
        }

    }

    public static JsonNode refreshLocalJson() throws IOException {
        if (new File("data/config.local.json").exists()) {
            localjson = mapper.readValue(new File("data/config.local.json"), JsonNode.class);
        }
        return localjson;
    }


    public static Boolean isLaunched() {
        if (localjson.has("firstLaunch")) {
            return localjson.get("firstLaunch").asBoolean();
        }
        return json.get("firstLaunch").asBoolean();
    }

    public static Boolean checkLocalJson(String fieldName) {
        return localjson.has(fieldName);
    }
}
