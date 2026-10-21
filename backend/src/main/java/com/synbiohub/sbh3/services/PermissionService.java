package com.synbiohub.sbh3.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.synbiohub.sbh3.dao.SparqlService;
import com.synbiohub.sbh3.security.model.User;
import com.synbiohub.sbh3.sparql.SPARQLQuery;
import com.synbiohub.sbh3.utils.ConfigUtil;
import com.synbiohub.sbh3.utils.ShareLinkUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PermissionService {

    private static final String SPARQL_DIR = "src/main/java/com/synbiohub/sbh3/sparql/";
    private static final String ADD_OWNED_BY_SPARQL = SPARQL_DIR + "AddOwnedBy.sparql";
    private static final String REMOVE_OWNED_BY_SPARQL = SPARQL_DIR + "RemoveOwnedBy.sparql";
    private static final String ADD_SHARED_SPARQL = SPARQL_DIR + "AddToSharedCollection.sparql";
    private static final String REMOVE_SHARED_SPARQL = SPARQL_DIR + "RemoveFromSharedCollection.sparql";
    private static final String FETCH_RELATED_URIS_SPARQL = SPARQL_DIR + "FetchRelatedURIs.sparql";
    private static final String GET_VIEWERS_SPARQL = SPARQL_DIR + "GetViewers.sparql";
    private static final String GET_OWNED_BY_SPARQL = SPARQL_DIR + "GetOwnedBy.sparql";
    private static final int DEFAULT_RESOLVE_BATCH = 20;
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final SparqlService sparqlService;
    private final UserService userService;
    private final SearchService searchService;

    /**
     * Grants {@code user} ownership of {@code subjectUri} and every object it references in the same graph,
     * and records {@code sbh:canView} in the recipient's graph so it appears in their {@code /shared} list.
     */
    public ResponseEntity<String> addOwner(String subjectUri, String user) throws IOException {
        if (isBlank(subjectUri) || isBlank(user)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
        if (!userService.isOwnedBy(subjectUri)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        User recipient = findUser(user);
        if (recipient == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("user " + lastSegment(user) + " not recognized");
        }

        String ownerUri = sparqlService.userSynbiohubMemberUri(recipient.getUsername());
        String graphUri = sparqlService.resolveGraphUriForTopLevel(subjectUri);

        try {
            updateSharedCollection(ADD_SHARED_SPARQL, subjectUri, ownerUri,
                    searchService.resolveUserNamedGraphUri(recipient));
            updateOwnedBy(ADD_OWNED_BY_SPARQL, retrieveUris(subjectUri, graphUri), ownerUri, graphUri);
        } catch (IOException e) {
            log.error("SPARQL add owner failed for {}", subjectUri, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }

        return ResponseEntity.ok("Success");
    }

    /**
     * Reverses {@link #addOwner}: removes {@code sbh:ownedBy} from the object and its children,
     * and the {@code sbh:canView} entry from the removed user's graph.
     */
    public ResponseEntity<String> removeOwner(
            String subjectUri, String username, String userUri) throws IOException {
        if (isBlank(subjectUri)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

        String ownerRef = !isBlank(userUri) ? userUri : username;
        if (isBlank(ownerRef)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

        if (!userService.isOwnedBy(subjectUri)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        User removed = findUser(ownerRef);
        String removedUsername = removed != null ? removed.getUsername() : lastSegment(ownerRef);
        String ownerUri = isUri(ownerRef) ? ownerRef : sparqlService.userSynbiohubMemberUri(removedUsername);
        String removedGraphUri = removed != null
                ? searchService.resolveUserNamedGraphUri(removed)
                : ConfigUtil.get("graphPrefix").asText() + "user/" + removedUsername;
        String graphUri = sparqlService.resolveGraphUriForTopLevel(subjectUri);

        try {
            updateSharedCollection(REMOVE_SHARED_SPARQL, subjectUri, ownerUri, removedGraphUri);
            updateOwnedBy(REMOVE_OWNED_BY_SPARQL, retrieveUris(subjectUri, graphUri), ownerUri, graphUri);
        } catch (IOException e) {
            log.error("SPARQL remove owner failed for {}", subjectUri, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }

        return ResponseEntity.ok("Success");
    }

    /**
     * Grants {@code user} view-only access: a single {@code sbh:canView} triple in the viewer's graph,
     * with no {@code sbh:ownedBy}. Caller must own the object.
     */
    public ResponseEntity<String> addViewer(String subjectUri, String user) throws IOException {
        if (isBlank(subjectUri) || isBlank(user)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
        if (!userService.isOwnedBy(subjectUri)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        User viewer = findUser(user);
        if (viewer == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("user " + lastSegment(user) + " not recognized");
        }

        try {
            updateSharedCollection(ADD_SHARED_SPARQL, subjectUri,
                    sparqlService.userSynbiohubMemberUri(viewer.getUsername()),
                    searchService.resolveUserNamedGraphUri(viewer));
        } catch (IOException e) {
            log.error("SPARQL add viewer failed for {}", subjectUri, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
        return ResponseEntity.ok("Success");
    }

    /**
     * Removes view-only access granted by {@link #addViewer}. Owners only; owners themselves must be
     * removed via {@link #removeOwner} so their {@code sbh:ownedBy} is cleared too.
     */
    public ResponseEntity<String> removeViewer(
            String subjectUri, String username, String userUri) throws IOException {
        if (isBlank(subjectUri)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
        String viewerRef = !isBlank(userUri) ? userUri : username;
        if (isBlank(viewerRef)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
        if (!userService.isOwnedBy(subjectUri)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        User viewer = findUser(viewerRef);
        String viewerUsername = viewer != null ? viewer.getUsername() : lastSegment(viewerRef);
        String viewerUri = viewer != null
                ? sparqlService.userSynbiohubMemberUri(viewer.getUsername())
                : (isUri(viewerRef) ? viewerRef : sparqlService.userSynbiohubMemberUri(viewerUsername));

        if (getOwners(subjectUri).contains(viewerUri)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("user " + viewerUsername + " is an owner; use removeOwner");
        }

        String viewerGraphUri = viewer != null
                ? searchService.resolveUserNamedGraphUri(viewer)
                : ConfigUtil.get("graphPrefix").asText() + "user/" + viewerUsername;
        try {
            updateSharedCollection(REMOVE_SHARED_SPARQL, subjectUri, viewerUri, viewerGraphUri);
        } catch (IOException e) {
            log.error("SPARQL remove viewer failed for {}", subjectUri, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
        return ResponseEntity.ok("Success");
    }

    /**
     * Users with {@code sbh:canView} on {@code subjectUri}, excluding owners. {@code canView} triples live
     * in each viewer's own graph, so this scans all named graphs. Visible to anyone with access to the
     * object (owners and viewers) so every viewer sees the same access list; removal stays owners-only.
     */
    public ResponseEntity<?> getViewers(String subjectUri) throws IOException {
        if (isBlank(subjectUri)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

        Set<String> owners = getOwners(subjectUri);
        String query = new SPARQLQuery(GET_VIEWERS_SPARQL).loadTemplate(Map.of("uri", subjectUri));
        String graphUri = sparqlService.resolveGraphUriForTopLevel(subjectUri);
        String raw = sparqlService.read(sparqlService.sparqlQueryUrl(), graphUri, query);

        List<Map<String, String>> viewers = new ArrayList<>();
        Set<String> allViewers = new HashSet<>();
        for (JsonNode binding : MAPPER.readTree(raw).path("results").path("bindings")) {
            String viewerUri = binding.path("viewer").path("value").asText("");
            if (viewerUri.isEmpty() || !allViewers.add(viewerUri) || owners.contains(viewerUri)) {
                continue;
            }
            String viewerUsername = lastSegment(viewerUri);
            User viewerUser = userService.getUserByUsername(viewerUsername);
            viewers.add(Map.of(
                    "username", viewerUsername,
                    "name", viewerUser == null || viewerUser.getName() == null ? "" : viewerUser.getName(),
                    "userUri", viewerUri));
        }

        String callerUri = currentUserUri();
        if (!owners.contains(callerUri) && !allViewers.contains(callerUri)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        viewers.sort((a, b) -> a.get("username").compareToIgnoreCase(b.get("username")));
        return ResponseEntity.ok(viewers);
    }

    /** Member URI ({@code graphPrefix + "user/" + username}) of the authenticated caller. */
    private String currentUserUri() throws IOException {
        return ConfigUtil.get("graphPrefix").asText() + "user/"
                + SecurityContextHolder.getContext().getAuthentication().getName();
    }

    /**
     * Salted share URL for an object (SBH1 {@code api/shareLink}: the hash is over the collection URI).
     * Owners only.
     */
    public ResponseEntity<String> getShareLink(String subjectUri) throws IOException {
        if (isBlank(subjectUri)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
        if (!userService.isOwnedBy(subjectUri)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        String hashBase = collectionUriFrom(subjectUri);
        return ResponseEntity.ok(subjectUri + "/" + ShareLinkUtil.token(hashBase, ShareLinkUtil.salt()) + "/share");
    }

    /** {@code databasePrefix + "user/" + userId + "/" + collectionId} portion of a user object URI. */
    private static String collectionUriFrom(String subjectUri) {
        int userSeg = subjectUri.indexOf("/user/");
        if (userSeg < 0) {
            return subjectUri;
        }
        int collectionStart = subjectUri.indexOf('/', userSeg + "/user/".length());
        if (collectionStart < 0) {
            return subjectUri;
        }
        int collectionEnd = subjectUri.indexOf('/', collectionStart + 1);
        return collectionEnd < 0 ? subjectUri : subjectUri.substring(0, collectionEnd);
    }

    /** All {@code sbh:ownedBy} user URIs for an object, from its own graph. */
    private Set<String> getOwners(String subjectUri) throws IOException {
        String query = new SPARQLQuery(GET_OWNED_BY_SPARQL).loadTemplate(Map.of("topLevel", subjectUri));
        String graphUri = sparqlService.resolveGraphUriForTopLevel(subjectUri);
        String raw = sparqlService.read(sparqlService.getExplorerUrl(), graphUri, query);
        Set<String> owners = new HashSet<>();
        for (JsonNode binding : MAPPER.readTree(raw).path("results").path("bindings")) {
            String owner = binding.path("ownedBy").path("value").asText("");
            if (!owner.isEmpty()) {
                owners.add(owner);
            }
        }
        return owners;
    }

    public String buildSubjectUri(
            boolean isPublic,
            String userId,
            String collectionId,
            String displayId,
            String version) throws IOException {
        String prefix = ConfigUtil.get("databasePrefix").asText();
        if (isPublic) {
            return prefix + "public/" + collectionId + "/" + displayId + "/" + version;
        }
        return prefix + "user/" + userId + "/" + collectionId + "/" + displayId + "/" + version;
    }

    private void updateSharedCollection(String template, String subjectUri, String userUri, String userGraphUri)
            throws IOException {
        String query = new SPARQLQuery(template).loadTemplate(Map.of("uri", subjectUri, "userUri", userUri));
        log.debug(query);
        sparqlService.update(query, userGraphUri, false);
    }

    private void updateOwnedBy(String template, List<String> uris, String ownerUri, String graphUri)
            throws IOException {
        int batchSize = resolveBatch();
        for (int i = 0; i < uris.size(); i += batchSize) {
            String triples = uris.subList(i, Math.min(i + batchSize, uris.size())).stream()
                    .map(uri -> "<" + uri + "> sbh:ownedBy <" + ownerUri + ">")
                    .collect(Collectors.joining(" . \n"));
            String query = new SPARQLQuery(template).loadTemplate(Map.of("uris", triples));
            log.debug(query);
            sparqlService.update(query, graphUri, false);
        }
    }

    /**
     * Breadth-first walk from {@code rootUri} collecting every object URI in {@code graphUri}
     * (legacy {@code retrieveUris}).
     */
    private List<String> retrieveUris(String rootUri, String graphUri) throws IOException {
        int batchSize = resolveBatch();
        String graphStem = graphUri.endsWith("/") ? graphUri : graphUri + "/";
        List<String> resolved = new ArrayList<>(List.of(rootUri));
        Set<String> seen = new HashSet<>(resolved);
        Deque<String> pending = new ArrayDeque<>(resolved);

        while (!pending.isEmpty()) {
            List<String> batch = new ArrayList<>();
            while (!pending.isEmpty() && batch.size() < batchSize) {
                batch.add(pending.poll());
            }

            String fragments = batch.stream()
                    .map(uri -> "{ <" + uri + "> ?p ?object }")
                    .collect(Collectors.joining(" UNION \n")) + " . ";
            String query = new SPARQLQuery(FETCH_RELATED_URIS_SPARQL)
                    .loadTemplate(Map.of("uriFragments", fragments));
            String raw = sparqlService.read(sparqlService.sparqlQueryUrl(), graphUri, query);

            for (JsonNode binding : MAPPER.readTree(raw).path("results").path("bindings")) {
                JsonNode object = binding.path("object");
                if (!"uri".equals(object.path("type").asText())) {
                    continue;
                }
                String uri = object.path("value").asText("");
                if (uri.startsWith(graphStem) && seen.add(uri)) {
                    resolved.add(uri);
                    pending.add(uri);
                }
            }
        }

        return resolved;
    }

    private User findUser(String userOrUri) {
        String id = lastSegment(userOrUri);
        User user = userService.getUserByUsername(id);
        return user != null ? user : userService.getUserByEmail(id);
    }

    private static int resolveBatch() throws IOException {
        JsonNode node = ConfigUtil.get("resolveBatch");
        int batch = node == null ? DEFAULT_RESOLVE_BATCH : node.asInt(DEFAULT_RESOLVE_BATCH);
        return batch > 0 ? batch : DEFAULT_RESOLVE_BATCH;
    }

    private static String lastSegment(String value) {
        return value.substring(value.lastIndexOf('/') + 1);
    }

    private static boolean isUri(String value) {
        return value.startsWith("http://") || value.startsWith("https://");
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
