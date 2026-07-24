package com.synbiohub.sbh3.repo;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.io.IOException;

@RequiredArgsConstructor
@Component
@Slf4j
public class SparqlRepository {
    public static final String SEARCH_SPARQL = "src/main/java/com/synbiohub/sbh3/sparql/search.sparql";
    public static final String SEARCH_COUNT_SPARQL = "src/main/java/com/synbiohub/sbh3/sparql/searchCount.sparql";
    public static final String COUNT_SPARQL = "src/main/java/com/synbiohub/sbh3/sparql/Count.sparql";
    public static final String ROOT_COLLECTION_METADATA_SPARQL = "src/main/java/com/synbiohub/sbh3/sparql/RootCollectionMetadata.sparql";
    public static final String SUBCOLLECTION_METADATA_SPARQL = "src/main/java/com/synbiohub/sbh3/sparql/SubCollectionMetadata.sparql";
    public static final String SHARED_VIEW_SPARQL = "src/main/java/com/synbiohub/sbh3/sparql/GetSharedCanView.sparql";
    public static final String TOPLEVEL_METADATA_SPARQL = "src/main/java/com/synbiohub/sbh3/sparql/GetTopLevelMetadata.sparql";

    private final RestClient restClient;

    /**
     * Runs a read-only SPARQL query via POST (same parameters as , for large queries).
     */
    public String executePostQuery(String url, String uri, String query) throws IOException {
        return restClient.post()
                .uri(url, uri, query)
                .retrieve()
                .body(String.class);
    }

    public String executeReadQuery(String url, String uri, String query) {
        return restClient.get()
                .uri(url, uri, query)
                .retrieve()
                .body(String.class);
    }

    /**
     * POST JSON to an arbitrary URL. Replaces the legacy {@code com.synbiohub.sbh3.utils.RestClient}.
     */
    public <T> ResponseEntity<T> postJson(String uri, Object requestBody, Class<T> responseType, HttpHeaders headers) {
        return restClient.post()
                .uri(uri)
                .headers(h -> {
                    if (headers != null) {
                        h.addAll(headers);
                    }
                    if (!h.containsKey(HttpHeaders.CONTENT_TYPE)) {
                        h.setContentType(MediaType.APPLICATION_JSON);
                    }
                })
                .body(requestBody)
                .retrieve()
                .toEntity(responseType);
    }
}
