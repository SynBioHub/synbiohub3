package com.synbiohub.sbh3.services;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.synbiohub.sbh3.utils.ConfigUtil;
import lombok.NoArgsConstructor;
import org.json.JSONObject;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.Objects;

@Service
@NoArgsConstructor
public class AdminService {

    public JSONObject getStatus() throws IOException {
        var config = ConfigUtil.get("");
        var node = new JSONObject()
                .put("version", config.get("version").asText())
                .put("instanceName", config.get("instanceName").asText())
                .put("port", config.get("port").asText())
                .put("sparqlEndpoint", config.get("triplestore").get("sparqlEndpoint").asText())
                .put("graphStoreEndpoint", config.get("triplestore").get("graphStoreEndpoint").asText())
                .put("defaultGraph", config.get("triplestore").get("defaultGraph").asText())
                .put("graphPrefix", config.get("triplestore").get("graphPrefix").asText());
        return node;
    }

    public String getTheme() throws IOException {
        ObjectMapper mapper = new ObjectMapper();
        ObjectNode json = mapper.createObjectNode();
        json.set("instanceName", ConfigUtil.get("instanceName"));
        json.set("frontPageText", ConfigUtil.get("frontPageText"));
        json.set("theme", ConfigUtil.get("theme"));
        json.set("themeParameters", ConfigUtil.get("themeParameters"));
        json.set("firstLaunch", ConfigUtil.get("firstLaunch"));
        String result = mapper.writeValueAsString(json);
        return result;
    }
}
