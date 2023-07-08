package com.synbiohub.sbh3.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.synbiohub.sbh3.sparql.SPARQLQuery;
import com.synbiohub.sbh3.utils.ConfigUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {

    private final UserService userService;
    private final SearchService searchService;
    private ObjectMapper mapper = new ObjectMapper();

    public JsonNode getStatus(HttpServletRequest request) throws Exception {
        String inputToken = request.getHeader("X-authorization");
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
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

    public Boolean getDatabaseStatus() {
        SPARQLQuery statusQuery = new SPARQLQuery("src/main/java/com/synbiohub/sbh3/sparql/GetDatabaseStatus.sparql");
        try {
            var result = searchService.SPARQLQuery(statusQuery.getQuery());
            if (result.getBytes().length > 0) {
                return true;
            } else {
                return false;
            }
        } catch (Exception e) {
            return false;
        }
    }

    public String getLogs() throws IOException {
        String logPath = System.getProperty("user.dir") + "/data/spring.log";
        return new String(Files.readAllBytes(Paths.get(logPath)));
    }

    public Boolean getSBOLExplorerStatus() throws IOException {
        return ConfigUtil.get("useSBOLExplorer").asBoolean();
    }

    public ArrayNode saveNewPlugin(Map<String, String> allParams) throws IOException {
        ArrayNode pluginArray = (ArrayNode) ConfigUtil.get("plugins").get(allParams.get("category"));
        if (!checkPluginName(pluginArray, allParams.get("name"))) {
            JsonNode pluginMap = castParamsToPlugin(allParams, pluginArray.size());
            pluginArray.add(pluginMap);
            log.info("Plugin: " + allParams.get("name") + " saved");
            return pluginArray;
        }
        log.error("Error saving new plugin: " + allParams.get("name"));
        return pluginArray;
    }

    public ArrayNode deletePlugin(String category, String id) throws IOException {
        JsonNode plugins = ConfigUtil.get("plugins").get(category);

        ArrayNode pluginArray = mapper.createArrayNode();
        if (plugins.isArray()) {
            pluginArray = (ArrayNode) plugins;
            for (int i = 0; i < pluginArray.size(); i++) {
                JsonNode innerNode = pluginArray.get(i);
                var temp1 = innerNode.get("index");
                if (innerNode.get("index").asInt() == (Integer.parseInt(id))) {
                    pluginArray.remove(i);
                    break;
                }
            }
        }
        return pluginArray;
    }

    public String updatePlugin(Map<String, String> allParams) throws IOException {
        return "Plugin updated";
    }

    private ObjectNode castParamsToPlugin(Map<String, String> allParams, int arraySize) {
        ObjectMapper mapper = new ObjectMapper();
        ObjectNode pluginMap = mapper.createObjectNode();
        pluginMap.put("name", allParams.get("name"));
        pluginMap.put("url", allParams.get("url")+"/");
        pluginMap.put("index", arraySize);
        return pluginMap;
    }

    private Boolean checkPluginName(ArrayNode pluginArray, String name) {
        for (String n : pluginArray.findValuesAsText("name")) {
            if (n.equals(name)) {
                return true;
            }
        }
        return false;
    }
}
