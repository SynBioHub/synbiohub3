package com.synbiohub.sbh3.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.synbiohub.sbh3.utils.ConfigUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.util.HashMap;

@Service
@RequiredArgsConstructor
public class EditService {

    /**
     * Sends a SPARQL query with full admin credentials.
     * @param query SPARQL Query to send
     * @return Virtuoso response
     */
    public String AuthSPARQLQuery(String query) throws IOException {
        String sparqlAuthEndpoint = ConfigUtil.get("sparqlAuthEndpoint").asText();
        String adminUsername = ConfigUtil.get("username").asText();
        String adminPassword = ConfigUtil.get("password").asText();
        String defaultGraph = ConfigUtil.get("defaultGraph").asText();

        RestTemplate restTemplate = new RestTemplate();
        String url = sparqlAuthEndpoint + "?default-graph-uri={defaultGraph}&query={query}&format=json&";
        HashMap<String, String> params = new HashMap<>();
        params.put("defaultGraph", defaultGraph);
        params.put("query", query);
        HttpHeaders headers = new HttpHeaders();
        headers.setBasicAuth(adminUsername, adminPassword);

        HttpEntity<String> entity = new HttpEntity<>(headers);

        return restTemplate.exchange(url, HttpMethod.POST, entity, String.class, params).getBody();
    }
}
