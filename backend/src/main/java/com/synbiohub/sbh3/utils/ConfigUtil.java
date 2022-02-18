package com.synbiohub.sbh3.utils;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;

@Slf4j
@Component
@RequiredArgsConstructor
public class ConfigUtil {

    public static JsonNode get(String key) {
        ObjectMapper mapper = new ObjectMapper();
        JsonNode json = null;
        try {
            // Initialize config.local.json
            if (!Files.exists(new File("data/config.local.json").toPath())) {
                Files.copy(new File("src/main/resources/config.json").toPath(), new File("data/config.local.json").toPath());
                json = mapper.readValue(new File("data/config.local.json"), JsonNode.class);
            } else
                json = mapper.readValue(new File("data/config.local.json"), JsonNode.class);

            if (key.isEmpty())
                return json;

            var item = json.get(key);
            if (!item.isNull())
                return item;
            else {
                // Go to regular config if item not in local
                json = mapper.readValue(new File("src/main/resources/config.json"), JsonNode.class);
                return json.get(key);
            }
        } catch (Exception e) {
            log.error("Error initializing config file!");
        }
        return null;
    }

    // TODO : Add set method
}
