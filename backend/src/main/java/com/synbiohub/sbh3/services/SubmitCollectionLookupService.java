package com.synbiohub.sbh3.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.synbiohub.sbh3.dto.submit.SanitizedSubmitPayload;
import com.synbiohub.sbh3.dto.submit.SubmitRootCollectionMetadata;
import com.synbiohub.sbh3.sparql.SPARQLQuery;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.Map;
import java.util.Optional;

/**
 * Submit pipeline: after sanitize, checks whether {@link SanitizedSubmitPayload#getCollectionUri()} already exists
 * as an {@code sbol2:Collection} in the submitter's named graph (see {@code RootCollectionMetadataForUri.sparql}).
 */
@Service
@RequiredArgsConstructor
public class SubmitCollectionLookupService {

    private static final String ROOT_COLLECTION_METADATA_FOR_URI =
            "src/main/java/com/synbiohub/sbh3/sparql/RootCollectionMetadataForUri.sparql";

    private final SearchService searchService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * @return metadata for the collection at {@code collectionUri} when present; empty when absent or unknown
     */
    public Optional<SubmitRootCollectionMetadata> getRootCollectionMetadata(SanitizedSubmitPayload sanitized)
            throws IOException {
        if (sanitized == null || sanitized.getCollectionUri() == null || sanitized.getCollectionUri().isBlank()) {
            return Optional.empty();
        }
        String namedGraph = searchService.resolveNamedGraphForSubmit(sanitized.getCreatedBy());
        String fromClause = namedGraph.isBlank() ? "" : "FROM <" + namedGraph + ">\n";
        SPARQLQuery q = new SPARQLQuery(ROOT_COLLECTION_METADATA_FOR_URI);
        String sparql = q.loadTemplate(Map.of(
                "from", fromClause,
                "collectionUri", sanitized.getCollectionUri()));
        String raw = searchService.SPARQLQuery(sparql, namedGraph.isBlank() ? null : namedGraph);
        return parseFirstBinding(raw);
    }

    private Optional<SubmitRootCollectionMetadata> parseFirstBinding(String rawJson) throws IOException {
        JsonNode bindings = objectMapper.readTree(rawJson).path("results").path("bindings");
        if (!bindings.isArray() || bindings.isEmpty()) {
            return Optional.empty();
        }
        JsonNode row = bindings.get(0);
        return Optional.of(SubmitRootCollectionMetadata.builder()
                .name(textBinding(row, "name"))
                .description(textBinding(row, "description"))
                .displayId(textBinding(row, "displayId"))
                .version(textBinding(row, "version"))
                .build());
    }

    private static String textBinding(JsonNode row, String var) {
        if (row == null || !row.has(var)) {
            return null;
        }
        JsonNode cell = row.get(var);
        if (!cell.hasNonNull("value")) {
            return null;
        }
        String v = cell.get("value").asText();
        return v.isEmpty() ? null : v;
    }
}
