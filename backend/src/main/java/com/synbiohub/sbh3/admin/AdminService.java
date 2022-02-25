package com.synbiohub.sbh3.admin;

import com.fasterxml.jackson.databind.JsonNode;
import com.synbiohub.sbh3.utils.ConfigUtil;
import lombok.NoArgsConstructor;
import org.json.JSONObject;
import org.springframework.stereotype.Service;

@Service
@NoArgsConstructor
public class AdminService {

    public JSONObject getStatus() {
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
}
