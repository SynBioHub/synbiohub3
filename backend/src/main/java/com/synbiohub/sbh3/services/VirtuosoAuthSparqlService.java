package com.synbiohub.sbh3.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.synbiohub.sbh3.sparql.SPARQLQuery;
import com.synbiohub.sbh3.utils.ConfigUtil;
import com.synbiohub.sbh3.utils.VirtuosoDigestRestTemplate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import java.io.IOException;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

/**
 * Authenticated SPARQL UPDATE/SELECT against Virtuoso named graphs (legacy {@code sparql.js}).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class VirtuosoAuthSparqlService {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private final VirtuosoDigestRestTemplate virtuosoHttp;

    public void deleteStaggered(String sparqlUpdate, String graphUri) throws IOException {
        while (true) {
            JsonNode bindings = updateQueryJson(sparqlUpdate, graphUri);
            if (bindings.isEmpty()) {
                return;
            }
            JsonNode first = bindings.get(0);
            JsonNode callret = first.path("callret-0");
            if (callret.isMissingNode()) {
                return;
            }
            String msg = callret.asText("");
            if (msg.contains("nothing to do")) {
                return;
            }
        }
    }

    public JsonNode queryJson(String sparql, String graphUri) throws IOException {
        String body = sparqlGet(sparql, graphUri, "application/sparql-results+json");
        JsonNode bindings = MAPPER.readTree(body).path("results").path("bindings");
        return bindingsToRowArray(bindings);
    }

    public void updateQuery(String sparql, String graphUri) throws IOException {
        sparqlPost(sparql, graphUri, MediaType.TEXT_PLAIN);
    }

    private JsonNode updateQueryJson(String sparql, String graphUri) throws IOException {
        String body = sparqlPost(sparql, graphUri, MediaType.parseMediaType("application/sparql-results+json"));
        JsonNode bindings = MAPPER.readTree(body).path("results").path("bindings");
        return bindingsToRowArray(bindings);
    }

    /** Legacy sparql-results-to-array: one object per binding row with var names as keys. */
    private static JsonNode bindingsToRowArray(JsonNode bindings) {
        var rows = MAPPER.createArrayNode();
        if (!bindings.isArray()) {
            return rows;
        }
        for (JsonNode binding : bindings) {
            var row = MAPPER.createObjectNode();
            Iterator<Map.Entry<String, JsonNode>> it = binding.fields();
            while (it.hasNext()) {
                Map.Entry<String, JsonNode> e = it.next();
                JsonNode cell = e.getValue();
                if (cell.hasNonNull("value")) {
                    row.put(e.getKey(), cell.get("value").asText());
                }
            }
            rows.add(row);
        }
        return rows;
    }

    private String sparqlPost(String sparql, String graphUri, MediaType accept) throws IOException {
        String url = authEndpoint() + "?query={query}&default-graph-uri={graph}";
        Map<String, String> params = new HashMap<>();
        params.put("query", sparql);
        params.put("graph", graphUri);
        HttpEntity<Void> entity = new HttpEntity<>(acceptHeaders(accept));
        ResponseEntity<String> res = virtuosoHttp.get().exchange(url, HttpMethod.POST, entity, String.class, params);
        return res.getBody() != null ? res.getBody() : "";
    }

    private String sparqlGet(String sparql, String graphUri, String accept) throws IOException {
        String url = authEndpoint() + "?query={query}&default-graph-uri={graph}&format=json";
        Map<String, String> params = new HashMap<>();
        params.put("query", sparql);
        params.put("graph", graphUri);
        HttpEntity<Void> entity = new HttpEntity<>(acceptHeaders(MediaType.parseMediaType(accept)));
        ResponseEntity<String> res = virtuosoHttp.get().exchange(url, HttpMethod.GET, entity, String.class, params);
        return res.getBody() != null ? res.getBody() : "";
    }

    private static HttpHeaders acceptHeaders(MediaType accept) {
        HttpHeaders headers = new HttpHeaders();
        headers.setAccept(java.util.List.of(accept));
        return headers;
    }

    private static String authEndpoint() throws IOException {
        JsonNode auth = ConfigUtil.get("sparqlAuthEndpoint");
        if (auth != null && !auth.isNull() && !auth.asText("").isBlank()) {
            return auth.asText().trim();
        }
        String base = ConfigUtil.get("sparqlEndpoint").asText().trim();
        return base.endsWith("-auth") ? base : base + "-auth";
    }

    public static String loadTemplate(String relativePath, Map<String, String> args) {
        SPARQLQuery q = new SPARQLQuery(relativePath);
        return q.loadTemplate(args);
    }

    public static String sparqlStringLiteral(String value) {
        if (value == null) {
            return "\"\"";
        }
        return "\"" + value.replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
    }
}
