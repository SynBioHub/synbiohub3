package com.synbiohub.sbh3.services;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.google.gson.JsonObject;
import com.synbiohub.sbh3.utils.ConfigUtil;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.json.JSONObject;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserService userService;
    private ObjectMapper mapper = new ObjectMapper();

    public JsonNode getStatus() throws IOException {
        Authentication authentication = userService.checkAuthentication();
        if (authentication == null) {
            return null;
        }
        ObjectNode status = mapper.createObjectNode();
        status.set("version", ConfigUtil.get("version"));
        status.set("instanceName", ConfigUtil.get("instanceName"));
        status.set("port", ConfigUtil.get("port"));
        status.set("sparqlEndpoint", ConfigUtil.get("sparqlEndpoint"));
        status.set("graphStoreEndpoint", ConfigUtil.get("graphStoreEndpoint"));
        status.set("defaultGraph", ConfigUtil.get("defaultGraph"));
        status.set("graphPrefix", ConfigUtil.get("graphPrefix"));
        status.set("firstLaunch", ConfigUtil.get("firstLaunch"));

        return (JsonNode) status;
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
