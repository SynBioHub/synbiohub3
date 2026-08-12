package com.synbiohub.sbh3.repo;

import com.fasterxml.jackson.databind.JsonNode;
import com.synbiohub.sbh3.utils.ConfigUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.hc.client5.http.ContextBuilder;
import org.apache.hc.client5.http.auth.AuthScope;
import org.apache.hc.client5.http.auth.UsernamePasswordCredentials;
import org.apache.hc.client5.http.classic.methods.HttpPost;
import org.apache.hc.client5.http.impl.auth.BasicCredentialsProvider;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.client5.http.protocol.HttpClientContext;
import org.apache.hc.core5.http.ContentType;
import org.apache.hc.core5.http.HttpHost;
import org.apache.hc.core5.http.io.HttpClientResponseHandler;
import org.apache.hc.core5.http.io.entity.ByteArrayEntity;
import org.apache.hc.core5.http.io.entity.EntityUtils;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
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
    public static final String SEARCH_SPARQL = "src/main/java/com/synbiohub/sbh3/sparql/search.sparql";
    public static final String SEARCH_COUNT_SPARQL = "src/main/java/com/synbiohub/sbh3/sparql/searchCount.sparql";
    public static final String COUNT_SPARQL = "src/main/java/com/synbiohub/sbh3/sparql/Count.sparql";
    public static final String ROOT_COLLECTION_METADATA_SPARQL = "src/main/java/com/synbiohub/sbh3/sparql/RootCollectionMetadata.sparql";
    public static final String SUBCOLLECTION_METADATA_SPARQL = "src/main/java/com/synbiohub/sbh3/sparql/SubCollectionMetadata.sparql";
    public static final String SHARED_VIEW_SPARQL = "src/main/java/com/synbiohub/sbh3/sparql/GetSharedCanView.sparql";
    public static final String TOPLEVEL_METADATA_SPARQL = "src/main/java/com/synbiohub/sbh3/sparql/GetTopLevelMetadata.sparql";

    private static final String AUTH_BASIC = "basic";
    private static final String AUTH_DIGEST = "digest";

    private final RestClient restClient;


    public String executeReadQuery(String url, String uri, String query) {
        return restClient.get()
                .uri(url, uri, query)
                .retrieve()
                .body(String.class);
    }

    /**
     * Runs a read-only SPARQL query via POST (same parameters as {@link #executeReadQuery}, for large queries).
     */
    public String executePostQuery(String url, String uri, String query) throws IOException {
        return restClient.post()
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

    /**
     * POST a SPARQL update to sparql-auth.
     * Auth mode is {@code triplestoreAuth}: {@code digest} (Virtuoso) or {@code basic} (sbol-db).
     *
     * @param jsonResults when {@code true}, requests {@code application/sparql-results+json}
     */
    public String update(String query, String graphUri, boolean jsonResults) throws IOException, URISyntaxException {
        StringBuilder url = new StringBuilder(sparqlAuthEndpoint());
        url.append("?query=").append(URLEncoder.encode(query, StandardCharsets.UTF_8));
        url.append("&default-graph-uri=").append(URLEncoder.encode(graphUri, StandardCharsets.UTF_8));
        if (jsonResults) {
            url.append("&format=")
                    .append(URLEncoder.encode("application/sparql-results+json", StandardCharsets.UTF_8));
        }

        HttpPost post = new HttpPost(url.toString());
        return executeAuthenticated(post, response -> {
            int code = response.getCode();
            if (code >= 300) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                        "SPARQL update failed (" + code + "): " + readResponseBody(response));
            }
            return readResponseBody(response);
        });
    }

    /**
     * POST RDF/XML to the graph store endpoint.
     * Auth mode is {@code triplestoreAuth}: {@code digest} (Virtuoso) or {@code basic} (sbol-db).
     */
    public void save(String graphUri, Path file) throws IOException, URISyntaxException {
        String endpoint = ConfigUtil.get("graphStoreEndpoint").asText();
        String url = endpoint
                + (endpoint.contains("?") ? "&" : "?")
                + "graph-uri=" + URLEncoder.encode(graphUri, StandardCharsets.UTF_8);

        byte[] body = Files.readAllBytes(file);
        HttpPost post = new HttpPost(url);
        post.setHeader(HttpHeaders.CONTENT_TYPE, "application/rdf+xml");
        post.setEntity(new ByteArrayEntity(body, ContentType.APPLICATION_XML));
        executeAuthenticated(post, response -> {
            int code = response.getCode();
            if (code >= 300) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                        "Graph store upload failed (" + code + "): " + readResponseBody(response));
            }
            EntityUtils.consume(response.getEntity());
            return null;
        });
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

    /**
     * Resolves {@code triplestoreAuth} from config ({@code basic} or {@code digest}; default {@code digest}).
     */
    private static String resolveTriplestoreAuth() throws IOException {
        JsonNode configured = ConfigUtil.get("triplestoreAuth");
        if (configured == null || configured.isNull()) {
            return AUTH_DIGEST;
        }
        String value = configured.asText("").trim().toLowerCase();
        if (AUTH_BASIC.equals(value)) {
            return AUTH_BASIC;
        }
        return AUTH_DIGEST;
    }

    /**
     * Authenticated POST for triplestore write endpoints.
     * <ul>
     *   <li>{@code basic} — preemptive Basic auth for sbol-db (avoids 401 + large-body disconnects).</li>
     *   <li>{@code digest} — challenge Digest auth for Virtuoso (legacy behavior).</li>
     * </ul>
     */
    private <T> T executeAuthenticated(
            HttpPost post,
            HttpClientResponseHandler<T> handler) throws IOException, URISyntaxException {
        UsernamePasswordCredentials credentials = new UsernamePasswordCredentials(
                ConfigUtil.get("username").asText(),
                ConfigUtil.get("password").asText().toCharArray());

        BasicCredentialsProvider credsProvider = new BasicCredentialsProvider();
        credsProvider.setCredentials(new AuthScope(null, -1), credentials);

        String authMode = resolveTriplestoreAuth();
        try (CloseableHttpClient client = HttpClients.custom()
                .setDefaultCredentialsProvider(credsProvider)
                .build()) {
            if (AUTH_BASIC.equals(authMode)) {
                URI uri = post.getUri();
                HttpHost target = HttpHost.create(uri);
                HttpClientContext context = ContextBuilder.create()
                        .useCredentialsProvider(credsProvider)
                        .preemptiveBasicAuth(target, credentials)
                        .build();
                return client.execute(target, post, context, handler);
            }
            // Digest (Virtuoso): wait for WWW-Authenticate challenge, then retry with Digest.
            return client.execute(post, handler);
        }
    }

    private String readResponseBody(org.apache.hc.core5.http.ClassicHttpResponse response)
            throws IOException {
        if (response.getEntity() == null) {
            return "";
        }
        return new String(response.getEntity().getContent().readAllBytes(), StandardCharsets.UTF_8);
    }
}
