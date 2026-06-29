package com.synbiohub.sbh3.services;

import com.synbiohub.sbh3.utils.ConfigUtil;
import com.synbiohub.sbh3.utils.VirtuosoDigestRestTemplate;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.HashMap;

@Service
@RequiredArgsConstructor
public class EditService {

    private final VirtuosoDigestRestTemplate virtuosoHttp;

    /**
     * Sends a SPARQL query with full admin credentials.
     * @param query SPARQL Query to send
     * @return Virtuoso response
     */
    public String AuthSPARQLQuery(String query) throws IOException {
        String sparqlAuthEndpoint = ConfigUtil.get("sparqlAuthEndpoint").asText();
        String defaultGraph = ConfigUtil.get("defaultGraph").asText();

        String url = sparqlAuthEndpoint + "?default-graph-uri={defaultGraph}&query={query}&format=json&";
        HashMap<String, String> params = new HashMap<>();
        params.put("defaultGraph", defaultGraph);
        params.put("query", query);

        HttpEntity<String> entity = new HttpEntity<>(new HttpHeaders());

        return virtuosoHttp.get().exchange(url, HttpMethod.POST, entity, String.class, params).getBody();
    }
}
