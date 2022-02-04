package com.synbiohub.sbh3.utils;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.FileNotFoundException;

@Slf4j
@Component
@RequiredArgsConstructor
public class ConfigUtil {

    public static JsonNode get(String key) {
        ObjectMapper mapper = new ObjectMapper();
        JsonNode json = null;
        try {
            json = mapper.readValue(new File("src/main/resources/config.json"), JsonNode.class);
            if (json.isEmpty())
                throw new FileNotFoundException();
        } catch (Exception e) {
            log.error("Error initializing config file!");
        }
        if (key.isEmpty())
            return json;
        return json.get(key);
    }

    // TODO : Add set method
}
