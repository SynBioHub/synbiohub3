package com.synbiohub.sbh3.services;

import com.synbiohub.sbh3.security.model.User;
import com.synbiohub.sbh3.utils.ConfigUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.HashSet;
import java.util.Set;

/**
 * Which named graphs a caller may use as {@code default-graph-uri} on /sparql: the public graph,
 * their own graph, graphs of objects shared with them via {@code sbh:canView}, or a verified
 * share-link graph. Admins should use {@code /admin/sparql} for cross-graph administrative queries.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SparqlAccessService {

    public static final String SHARE_GRAPH_ATTR = "sbh.share.graph";
    public static final String SHARE_URI_ATTR = "sbh.share.uri";

    private final SearchService searchService;

    public Set<String> allowedGraphs(User user, String shareGraph) throws IOException {
        Set<String> allowed = new HashSet<>();
        allowed.add(ConfigUtil.get("defaultGraph").asText());
        if (shareGraph != null && !shareGraph.isBlank()) {
            allowed.add(shareGraph);
        }
        if (user != null) {
            allowed.add(searchService.resolveUserNamedGraphUri(user));
            allowed.addAll(searchService.getSharedWithMeGraphUris(user));
        }
        return allowed;
    }

    /** A blank requested graph keeps the explorer's default behaviour; otherwise the graph must be in allowed. */
    static boolean isGraphAllowed(Set<String> allowed, String requestedGraph) {
        if (requestedGraph == null || requestedGraph.isBlank()) {
            return true;
        }
        return allowed.contains(requestedGraph) || allowed.contains(stripTrailingSlash(requestedGraph));
    }

    /**
     * Graph to actually query: a verified share link pins the query to the shared object's graph
     * (client parameter ignored, as in SBH1); otherwise the requested graph must be allowed.
     */
    public String resolveGraph(User user, String shareGraph, String requestedGraph) throws IOException {
        if (shareGraph != null && !shareGraph.isBlank()) {
            return shareGraph;
        }
        if (!isGraphAllowed(allowedGraphs(user, null), requestedGraph)) {
            log.warn("SPARQL graph access denied: user={} graph={}",
                    user == null ? "anonymous" : user.getUsername(), requestedGraph);
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot access other users' graphs.");
        }
        return requestedGraph;
    }

    private static String stripTrailingSlash(String graph) {
        return graph.endsWith("/") ? graph.substring(0, graph.length() - 1) : graph;
    }
}
