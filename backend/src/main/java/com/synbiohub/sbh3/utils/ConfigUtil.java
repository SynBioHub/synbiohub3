package com.synbiohub.sbh3.utils;


import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;

@Slf4j
@Component
public class ConfigUtil {

    private static JsonNode json;
    private static JsonNode localjson;
    private static ObjectMapper mapper = new ObjectMapper();

    public ConfigUtil() {
        localjson = null;
        json = null;
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
