package com.synbiohub.sbh3.utils;

import com.fasterxml.jackson.core.exc.StreamReadException;
import com.fasterxml.jackson.databind.DatabindException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import javax.json.Json;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;

@Slf4j
@Component
public class ConfigUtil {

    private static JsonNode json;
    private static JsonNode localjson;
    private static ObjectMapper mapper = new ObjectMapper();

    public ConfigUtil() {
        localjson = null;
        json = null;
//        try {
//            // Initialize config.local.dup.json
//            if (!Files.exists(new File("data/config.local.dup.json").toPath())) {
//                Files.copy(new File("src/main/resources/config.json").toPath(), new File("data/config.local.dup.json").toPath());
//                json = mapper.readValue(new File("data/config.local.dup.json"), JsonNode.class);
//            } else
//                json = mapper.readValue(new File("data/config.local.dup.json"), JsonNode.class);
//
//        } catch (Exception e) {
//            log.error("Error intializing config file!");
//        }
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

    // TODO : Add set method

    public static JsonNode refreshLocalJson() throws IOException {
        if (new File("data/config.local.json").exists()) {
            localjson = mapper.readValue(new File("data/config.local.json"), JsonNode.class);
        }
        return localjson;
    }


    public Boolean isLaunched() {
        return json.get("firstLaunch").asBoolean();
    }
}
