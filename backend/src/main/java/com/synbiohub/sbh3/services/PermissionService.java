package com.synbiohub.sbh3.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.synbiohub.sbh3.dao.SparqlService;
import com.synbiohub.sbh3.security.model.User;
import com.synbiohub.sbh3.sparql.SPARQLQuery;
import com.synbiohub.sbh3.utils.ConfigUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
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
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
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
