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
 * their own graph, graphs of objects shared with them via {@code sbh:canView}, a verified share-link
 * graph, or any graph for admins. Closes the previous behaviour where any caller could read any
 * user's private graph by naming it.
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

    /** Admins may query any graph; a blank requested graph keeps the explorer's default behaviour. */
    static boolean isGraphAllowed(Set<String> allowed, boolean admin, String requestedGraph) {
        if (requestedGraph == null || requestedGraph.isBlank() || admin) {
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
        if (!isGraphAllowed(allowedGraphs(user, null), isAdmin(user), requestedGraph)) {
            log.warn("SPARQL graph access denied: user={} graph={}",
                    user == null ? "anonymous" : user.getUsername(), requestedGraph);
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot access other users' graphs.");
        }
        return requestedGraph;
    }

    static boolean isAdmin(User user) {
        if (user == null) {
            return false;
        }
        if (Boolean.TRUE.equals(user.getIsAdmin())) {
            return true;
        }
        return user.getAuthorities() != null && user.getAuthorities().stream()
                .anyMatch(a -> "ADMIN".equals(a.getAuthority()));
    }

    private static String stripTrailingSlash(String graph) {
        return graph.endsWith("/") ? graph.substring(0, graph.length() - 1) : graph;
    }
}
