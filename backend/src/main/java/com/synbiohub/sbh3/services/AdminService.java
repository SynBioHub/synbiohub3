package com.synbiohub.sbh3.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.synbiohub.sbh3.sparql.SPARQLQuery;
import com.synbiohub.sbh3.utils.ConfigUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserService userService;
    private final SearchService searchService;
    private ObjectMapper mapper = new ObjectMapper();

    public JsonNode getStatus(HttpServletRequest request) throws Exception {
        String inputToken = request.getHeader("X-authorization");
//        Authentication authentication = userService.checkAuthentication(inputToken);
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
}
