package com.synbiohub.sbh3.admin;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.info.BuildProperties;
import org.springframework.stereotype.Service;

@Service
public class AdminService {

    @Autowired
    JsonNode config;

    @Autowired
    ObjectMapper mapper;

    @Autowired
    BuildProperties buildProperties;


    public String getStatus() {
        ObjectNode node = mapper.createObjectNode();
        node.put("platform", System.getProperty("os.name"));
        node.put("architecture", System.getProperty("os.arch"));
        node.put("osRelease", System.getProperty("os.version"));
        node.put("version", buildProperties.getVersion());  // Version of SynBioHub3. Corresponds with <version> tag in pom.xml.
        node.put("instanceName", config.get("instanceName").asText());
        node.put("instanceUrl", config.get("instanceUrl").asText());
        node.put("listenPort", config.get("port").asText());
        node.put("sparqlEndpoint", config.get("triplestore").get("sparqlEndpoint").asText());
        node.put("graphStoreEndpoint", config.get("triplestore").get("graphStoreEndpoint").asText());
        node.put("defaultGraph", config.get("triplestore").get("defaultGraph").asText());
        node.put("graphPrefix", config.get("triplestore").get("graphPrefix").asText());
        node.put("databasePrefix", config.get("databasePrefix").asText());
        node.put("removePublicEnabled", config.get("removePublicEnabled").asText());
        node.put("uploadLimit", config.get("uploadLimit").asText());
        node.put("resolveBatch", config.get("resolveBatch").asText());
        node.put("fetchLimit", config.get("fetchLimit").asText());
        node.put("staggeredQueryLimit", config.get("staggeredQueryLimit").asText());

        return node.toString();
    }
}
