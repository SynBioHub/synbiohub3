package com.synbiohub.sbh3.repo;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.synbiohub.sbh3.utils.ConfigUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.hc.client5.http.auth.AuthScope;
import org.apache.hc.client5.http.auth.UsernamePasswordCredentials;
import org.apache.hc.client5.http.classic.methods.HttpPost;
import org.apache.hc.client5.http.impl.auth.BasicCredentialsProvider;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.http.ContentType;
import org.apache.hc.core5.http.io.entity.ByteArrayEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

@RequiredArgsConstructor
@Component
@Slf4j
public class SparqlRepository {
    // SPARQL templates used during prepare (overwrite) and upload (attachments).
    public static final String REMOVE_COLLECTION_SPARQL = "src/main/java/com/synbiohub/sbh3/sparql/removeCollection.sparql";
    public static final String REMOVE_SPARQL = "src/main/java/com/synbiohub/sbh3/sparql/remove.sparql";
    public static final String GET_ATTACHMENT_SOURCE_SPARQL = "src/main/java/com/synbiohub/sbh3/sparql/GetAttachmentSourceFromTopLevel.sparql";
    public static final String ATTACH_UPLOAD_SPARQL = "src/main/java/com/synbiohub/sbh3/sparql/AttachUpload.sparql";
    public static final String UPDATE_ATTACHMENT_SPARQL = "src/main/java/com/synbiohub/sbh3/sparql/UpdateAttachment.sparql";
    public static final String ATTACHMENT_UPDATE_SPARQL = "src/main/java/com/synbiohub/sbh3/sparql/AttachmentUpdate.sparql";

    private final ObjectMapper objectMapper;
    private final RestClient restClient;

    /**
     * Runs a read-only SPARQL query against {@code sparqlEndpoint} and returns JSON results.
     */
    public String getQuery(String query) throws IOException {
        return getQuery(query, null);
    }

    public String getQuery(String query, String defaultGraphUri) throws IOException {
        String graphUri = resolveGraphUri(defaultGraphUri);
        return restClient.get()
                .uri(sparqlQueryUrl(), graphUri, query)
                .retrieve()
                .body(String.class);
    }

    /**
     * Runs a read-only SPARQL query via POST (same parameters as {@link #getQuery}, for large queries).
     */
    public String postQuery(String query) throws IOException {
        return postQuery(query, null);
    }

    public String postQuery(String query, String defaultGraphUri) throws IOException {
        String graphUri = resolveGraphUri(defaultGraphUri);
        return restClient.post()
                .uri(sparqlQueryUrl(), graphUri, query)
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

    /**
     * POST a SPARQL update to sparql-auth with digest auth (not preemptive basic auth).
     *
     * @param jsonResults when {@code true}, requests {@code application/sparql-results+json}
     */
    public String update(String query, String graphUri, boolean jsonResults) throws IOException {
        StringBuilder url = new StringBuilder(sparqlAuthEndpoint());
        url.append("?query=").append(URLEncoder.encode(query, StandardCharsets.UTF_8));
        url.append("&default-graph-uri=").append(URLEncoder.encode(graphUri, StandardCharsets.UTF_8));
        if (jsonResults) {
            url.append("&format=")
                    .append(URLEncoder.encode("application/sparql-results+json", StandardCharsets.UTF_8));
        }

        try (CloseableHttpClient client = virtuosoDigestClient()) {
            HttpPost post = new HttpPost(url.toString());
            return client.execute(post, response -> {
                int code = response.getCode();
                if (code >= 300) {
                    throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                            "SPARQL update failed (" + code + "): " + readResponseBody(response));
                }
                return readResponseBody(response);
            });
        }
    }

    /**
     * POST RDF/XML to the Virtuoso graph store. Uses digest auth (not preemptive basic auth),
     * matching legacy {@code sparql.uploadSmallFile}.
     */
    public void save(String graphUri, Path file) throws IOException {
        String endpoint = ConfigUtil.get("graphStoreEndpoint").asText();
        String url = endpoint
                + (endpoint.contains("?") ? "&" : "?")
                + "graph-uri=" + URLEncoder.encode(graphUri, StandardCharsets.UTF_8);

        byte[] body = Files.readAllBytes(file);
        try (CloseableHttpClient client = virtuosoDigestClient()) {
            HttpPost post = new HttpPost(url);
            post.setHeader(HttpHeaders.CONTENT_TYPE, "application/rdf+xml");
            post.setEntity(new ByteArrayEntity(body, ContentType.APPLICATION_XML));
            client.execute(post, response -> {
                int code = response.getCode();
                if (code >= 300) {
                    throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                            "Graph store upload failed (" + code + "): " + readResponseBody(response));
                }
                return null;
            });
        }
    }

    /** Derives sparql-auth URL from config (explicit or inferred from sparqlEndpoint). */
    private String sparqlQueryUrl() throws IOException {
        return ConfigUtil.get("sparqlEndpoint").asText()
                + "?default-graph-uri={default-graph-uri}&query={query}&format=json&";
    }

    private String resolveGraphUri(String defaultGraphUri) throws IOException {
        if (defaultGraphUri == null || defaultGraphUri.isBlank()) {
            return ConfigUtil.get("defaultGraph").asText();
        }
        return defaultGraphUri;
    }

    private String sparqlAuthEndpoint() throws IOException {
        JsonNode configured = ConfigUtil.get("sparqlAuthEndpoint");
        if (configured != null && !configured.isNull() && !configured.asText().isBlank()) {
            return configured.asText();
        }
        String base = ConfigUtil.get("sparqlEndpoint").asText();
        if (base.endsWith("-auth") || base.endsWith("-auth/")) {
            return base;
        }
        return base.replaceAll("/sparql/?$", "/sparql-auth");
    }

    /** HttpClient configured for Virtuoso digest auth (waits for 401 challenge). */
    private static CloseableHttpClient virtuosoDigestClient() throws IOException {
        BasicCredentialsProvider credsProvider = new BasicCredentialsProvider();
        credsProvider.setCredentials(
                new AuthScope(null, -1),
                new UsernamePasswordCredentials(
                        ConfigUtil.get("username").asText(),
                        ConfigUtil.get("password").asText().toCharArray()));
        return HttpClients.custom()
                .setDefaultCredentialsProvider(credsProvider)
                .build();
    }

    private String readResponseBody(org.apache.hc.core5.http.ClassicHttpResponse response)
            throws IOException {
        if (response.getEntity() == null) {
            return "";
        }
        return new String(response.getEntity().getContent().readAllBytes(), StandardCharsets.UTF_8);
    }
}
