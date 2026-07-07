package com.synbiohub.sbh3.dao;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.synbiohub.sbh3.repo.SparqlRepository;
import com.synbiohub.sbh3.sparql.SPARQLQuery;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Path;
import java.util.Map;

@RequiredArgsConstructor
@Service
public class SparqlService {

    private final SparqlRepository sparqlRepository;
    private final ObjectMapper objectMapper;

    /**
     * Virtuoso DELETE templates return one row per batch; loop until nothing remains.
     * Legacy {@code sparql.deleteStaggered}.
     */
    public void deleteCollection(Map<String, String> params, String graphUri) throws IOException {
        deleteStaggered(sparqlRepository.REMOVE_COLLECTION_SPARQL, params, graphUri);
    }

    public void delete(Map<String, String> params, String graphUri) throws IOException {
        deleteStaggered(sparqlRepository.REMOVE_SPARQL, params, graphUri);
    }

    public void uploadGraphStore(String graphUri, Path file) throws IOException {
        sparqlRepository.save(graphUri, file);
    }

    public void uploadAttachment(Map<String, String> params, String graphUri) throws IOException {
        String query = new SPARQLQuery(sparqlRepository.ATTACHMENT_UPDATE_SPARQL).loadTemplate(params);
        sparqlRepository.update(query, graphUri, false);
    }

    public void update(String query, String graphUri, boolean jsonResults) throws IOException {
        sparqlRepository.update(query, graphUri, jsonResults);
    }

    private void deleteStaggered(String queryTemplate, Map<String, String> params, String graphUri) throws IOException {
        String query = new SPARQLQuery(queryTemplate).loadTemplate(params);
        while (true) {
            String raw = sparqlRepository.update(query, graphUri, true);
            JsonNode bindings = objectMapper.readTree(raw).path("results").path("bindings");
            if (!bindings.isArray() || bindings.isEmpty()) {
                break;
            }
            String msg = bindings.get(0).path("callret-0").path("value").asText("");
            if (msg.contains("nothing to do")) {
                break;
            }
        }
    }

}
