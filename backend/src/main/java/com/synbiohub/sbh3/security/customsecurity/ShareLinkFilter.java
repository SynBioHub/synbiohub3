package com.synbiohub.sbh3.security.customsecurity;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.synbiohub.sbh3.dao.SparqlService;
import com.synbiohub.sbh3.services.SparqlAccessService;
import com.synbiohub.sbh3.sparql.SPARQLQuery;
import com.synbiohub.sbh3.utils.ConfigUtil;
import com.synbiohub.sbh3.utils.ShareLinkUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Serves legacy share links {@code /user/{u}/{...}/{version}/{hash}/share[/action]}: verifies the salted
 * hash (object, collection, or /edit variant), strips {@code /{hash}/share} so existing handlers see the
 * plain object path, and pins the request to the owner's graph via request attributes. Runs before the
 * Spring Security chain so it can admit anonymous link holders. Invalid hashes get a 404.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@RequiredArgsConstructor
@Slf4j
public class ShareLinkFilter extends OncePerRequestFilter {

    private static final Pattern SHARE_PATH =
            Pattern.compile("^(/user/[^/]+/.+)/([0-9a-fA-F]{40})/share(/.*)?$");
    private static final String CONTAINING_COLLECTIONS_SPARQL =
            "src/main/java/com/synbiohub/sbh3/sparql/GetContainingCollections.sparql";
    private static final List<String> ALLOWED_ORIGINS =
            List.of("http://localhost:3333", "http://localhost:8080");
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final SparqlService sparqlService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String path = ServletPathUtil.getPathWithinApplication(request);
        Matcher matcher = SHARE_PATH.matcher(path == null ? "" : path);
        if (!matcher.matches()) {
            filterChain.doFilter(request, response);
            return;
        }

        String objectPath = matcher.group(1);
        String hash = matcher.group(2);
        String rest = matcher.group(3) == null ? "" : matcher.group(3);

        String databasePrefix = ConfigUtil.get("databasePrefix").asText();
        String graphPrefix = ConfigUtil.get("graphPrefix").asText();
        String[] segments = objectPath.split("/");
        // segments: ["", "user", userId, collectionId, displayId..., version]
        if (segments.length < 6) {
            filterChain.doFilter(request, response);
            return;
        }
        String userId = segments[2];
        String objectUri = databasePrefix + objectPath.substring(1);
        String collectionUri = databasePrefix + "user/" + userId + "/" + segments[3];
        String graphUri = graphPrefix + "user/" + userId;
        String salt = ShareLinkUtil.salt();

        if (!ShareLinkUtil.matches(objectUri, collectionUri, hash, salt)
                && !matchesContainingCollection(objectUri, graphUri, hash, salt)) {
            log.debug("Share link hash rejected for {}", objectPath);
            sendNotFound(request, response);
            return;
        }
        HttpServletRequest wrapped = new SharePathRequestWrapper(request, objectPath + rest);
        wrapped.setAttribute(SparqlAccessService.SHARE_GRAPH_ATTR, graphUri);
        wrapped.setAttribute(SparqlAccessService.SHARE_URI_ATTR, objectUri);
        filterChain.doFilter(wrapped, response);
    }

    /**
     * Member links on a collection page reuse the collection's share hash (Members.js). Accept the hash
     * when it belongs to a collection in the owner's graph that contains this object. Only runs on the
     * mismatch path, so normal share links pay no extra query.
     */
    private boolean matchesContainingCollection(String objectUri, String graphUri, String hash, String salt) {
        try {
            for (String candidate : List.of(objectUri, persistentIdentityOf(objectUri))) {
                String query = new SPARQLQuery(CONTAINING_COLLECTIONS_SPARQL)
                        .loadTemplate(Map.of("uri", candidate));
                String raw = sparqlService.read(sparqlService.sparqlQueryUrl(), graphUri, query);
                for (JsonNode binding : MAPPER.readTree(raw).path("results").path("bindings")) {
                    String coll = binding.path("coll").path("value").asText("");
                    if (!coll.isEmpty() && MessageDigest.isEqual(
                            hash.getBytes(StandardCharsets.UTF_8),
                            ShareLinkUtil.token(coll, salt).getBytes(StandardCharsets.UTF_8))) {
                        return true;
                    }
                }
            }
        } catch (Exception e) {
            log.debug("Containing-collection share check failed for {}", objectUri, e);
        }
        return false;
    }

    private static String persistentIdentityOf(String versionedUri) {
        int slash = versionedUri.lastIndexOf('/');
        return slash > 0 ? versionedUri.substring(0, slash) : versionedUri;
    }

    /**
     * This filter short-circuits before Spring's CORS handling, so error responses need CORS headers
     * explicitly; without them the browser reports a Network Error instead of the real 404.
     */
    private static void sendNotFound(HttpServletRequest request, HttpServletResponse response) throws IOException {
        String origin = request.getHeader("Origin");
        if (origin != null && ALLOWED_ORIGINS.contains(origin)) {
            response.setHeader("Access-Control-Allow-Origin", origin);
            response.setHeader("Access-Control-Allow-Credentials", "true");
            response.setHeader("Vary", "Origin");
        }
        response.sendError(HttpServletResponse.SC_NOT_FOUND);
    }

    /** Rewrites the visible path to the object path with {@code /{hash}/share} removed. */
    private static final class SharePathRequestWrapper extends HttpServletRequestWrapper {
        private final String path;

        private SharePathRequestWrapper(HttpServletRequest request, String path) {
            super(request);
            this.path = path;
        }

        @Override
        public String getRequestURI() {
            return getContextPath() + path;
        }

        @Override
        public StringBuffer getRequestURL() {
            StringBuffer url = new StringBuffer();
            url.append(getScheme()).append("://").append(getServerName());
            int port = getServerPort();
            if (("http".equals(getScheme()) && port != 80) || ("https".equals(getScheme()) && port != 443)) {
                url.append(':').append(port);
            }
            return url.append(getRequestURI());
        }

        @Override
        public String getServletPath() {
            return path;
        }

        @Override
        public String getPathInfo() {
            return null;
        }
    }
}
