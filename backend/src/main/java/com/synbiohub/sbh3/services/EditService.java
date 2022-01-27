package com.synbiohub.sbh3.services;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;

@Service
@RequiredArgsConstructor
public class EditService {

    @Value("${useSBOLExplorer}")
    private Boolean useSBOLExplorer;

    @Value("${SBOLExplorerEndpoint}")
    private String sbolExplorerEndpoint;

    @Value("${triplestore.sparqlAuthEndpoint}")
    private String sparqlAuthEndpoint;

    @Value("${triplestore.username}")
    private String adminUsername;

    @Value("${triplestore.password}")
    private String adminPassword;

    @Value("${triplestore.defaultGraph}")
    private String defaultGraph;


    /**
     * Sends a SPARQL query with full admin credentials.
     * @param query SPARQL Query to send
     * @return Virtuoso response
     */
    public String AuthSPARQLQuery(String query) {
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
