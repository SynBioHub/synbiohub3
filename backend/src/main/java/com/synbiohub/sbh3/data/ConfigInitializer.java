package com.synbiohub.sbh3.data;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

@Configuration
public class ConfigInitializer {

    @Autowired
    ObjectMapper objectMapper;

    @Bean(name = "config")
    public JsonNode config() throws IOException {
        JsonNode config = objectMapper.readTree
                (Files.readString(Path.of("src/main/java/com/synbiohub/sbh3/data/config.json")));
        return config;
    }
}
