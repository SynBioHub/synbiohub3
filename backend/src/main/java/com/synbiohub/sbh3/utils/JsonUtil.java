package com.synbiohub.sbh3.utils;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.util.Map;

@RequiredArgsConstructor
@Component
public class JsonUtil {

    private final ObjectMapper objectMapper;

    /**
     * Reads a flat JSON object from the application classpath as string key/value pairs.
     *
     * @param resourceName classpath resource name, such as {@code searchCriteriaTemplate.json}
     * @return JSON object contents as a map
     */
    public Map<String, String> readStringMapFromClasspath(String resourceName) throws IOException {
        try (InputStream in = JsonUtil.class.getClassLoader().getResourceAsStream(resourceName)) {
            if (in == null) {
                throw new IOException(resourceName + " not found on classpath");
            }
            return objectMapper.readValue(in, new TypeReference<Map<String, String>>() {});
        }
    }
}
