package com.synbiohub.sbh3.dao;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.synbiohub.sbh3.repo.SparqlRepository;
import com.synbiohub.sbh3.sparql.SPARQLQuery;
import com.synbiohub.sbh3.utils.StringUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Path;
import java.util.HashMap;
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

    /** Maps existing {@code sbol:source} values (e.g. {@code file:foo.png}) to attachment URIs. */
    public Map<String, String> loadAttachmentSources(String collectionUri, String graphUri) throws IOException {
        String query = new SPARQLQuery(SparqlRepository.GET_ATTACHMENT_SOURCE_SPARQL)
                .loadTemplate(Map.of("uri", collectionUri));
        String raw = sparqlRepository.getQuery(query, graphUri);
        Map<String, String> sources = new HashMap<>();
        JsonNode bindings = objectMapper.readTree(raw).path("results").path("bindings");
        if (!bindings.isArray()) {
            return sources;
        }
        for (JsonNode row : bindings) {
            String source = row.path("source").path("value").asText(null);
            String attachment = row.path("attachment").path("value").asText(null);
            if (source != null && attachment != null) {
                sources.put(source, attachment);
            }
        }
        return sources;
    }

    public void attachUpload(Map<String, String> params, String graphUri, boolean jsonResults) throws IOException {
        String query = new SPARQLQuery(sparqlRepository.ATTACH_UPLOAD_SPARQL).loadTemplate(params);
        update(query, graphUri, false);
    }

    /** Replaces hash/size on an existing attachment when re-uploading the same {@code file:} source. */
    public void updateAttachment(String graphUri, String attachmentUri, String uploadHash, long size)
            throws IOException {
        String query = new SPARQLQuery(sparqlRepository.UPDATE_ATTACHMENT_SPARQL).loadTemplate(Map.of(
                "attachmentURI", attachmentUri,
                "attachmentSource", attachmentUri + "/download",
                "hash", StringUtil.sparqlStringLiteral(uploadHash),
                "size", StringUtil.sparqlStringLiteral(Long.toString(size))));
        update(query, graphUri, false);
    }

    public Map<String, String> buildSearchQuery(Map<String, String> allParams) {
        HashMap<String, String> sparqlArgs = new HashMap<>
                (Map.of("from", "", "criteria", "", "limit", "", "offset", ""));

        // Process search parameters
        for (Map.Entry<String, String> param : allParams.entrySet()) {
            // Set offset and limit of query
            if (param.getKey().equals("offset")) {
                sparqlArgs.replace("offset", "OFFSET " + param.getValue());
                sparqlArgs.replace("limit", "LIMIT 50"); // Default limit for queries without limit
            }

            else if (param.getKey().equals("limit")) {
                sparqlArgs.replace("limit", "LIMIT " + param.getValue());
            }
        }

        return sparqlArgs;

    }

}
