package com.synbiohub.sbh3.services;

import com.synbiohub.sbh3.dao.SparqlService;
import com.synbiohub.sbh3.sparql.SPARQLQuery;
import com.synbiohub.sbh3.utils.ConfigUtil;
import com.synbiohub.sbh3.utils.StringUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.joda.time.DateTime;
import org.joda.time.format.DateTimeFormatter;
import org.joda.time.format.ISODateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.BiFunction;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class EditService {

    private static final String UPDATE_MUTABLE_DESCRIPTION_SPARQL =
            "src/main/java/com/synbiohub/sbh3/sparql/UpdateMutableDescription.sparql";
    private static final String UPDATE_MUTABLE_NOTES_SPARQL =
            "src/main/java/com/synbiohub/sbh3/sparql/UpdateMutableNotes.sparql";
    private static final String UPDATE_MUTABLE_SOURCE_SPARQL =
            "src/main/java/com/synbiohub/sbh3/sparql/UpdateMutableSource.sparql";
    private static final String UPDATE_CITATIONS_SPARQL =
            "src/main/java/com/synbiohub/sbh3/sparql/UpdateCitations.sparql";
    private static final String UPDATE_TRIPLE_SPARQL =
            "src/main/java/com/synbiohub/sbh3/sparql/UpdateTriple.sparql";
    private static final String ADD_TRIPLE_SPARQL =
            "src/main/java/com/synbiohub/sbh3/sparql/AddTriple.sparql";
    private static final String REMOVE_TRIPLE_SPARQL =
            "src/main/java/com/synbiohub/sbh3/sparql/RemoveTriple.sparql";

    private static final Map<String, String> FIELD_PREDICATES = Map.of(
            "title", "http://purl.org/dc/terms/title",
            "description", "http://purl.org/dc/terms/description",
            "role", "http://sbols.org/v2#role",
            "type", "http://sbols.org/v2#type",
            "wasDerivedFrom", "http://www.w3.org/ns/prov#wasDerivedFrom"
    );

    private static final Set<String> EDIT_LITERAL_FIELDS = Set.of("title", "description");
    private static final Set<String> IRI_FIELDS = Set.of("role", "type", "wasDerivedFrom");

    private final SparqlService sparqlService;
    private final UserService userService;
    private final CitationService citationService;

    public ResponseEntity<String> updateMutableDescription(Map<String, String> allParams) throws IOException {
        return updateTopLevel(allParams, UPDATE_MUTABLE_DESCRIPTION_SPARQL,
                (uri, value) -> Map.of("desc", value));
    }

    public ResponseEntity<String> updateMutableNotes(Map<String, String> allParams) throws IOException {
        return updateTopLevel(allParams, UPDATE_MUTABLE_NOTES_SPARQL,
                (uri, value) -> Map.of("notes", value));
    }

    public ResponseEntity<String> updateMutableSource(Map<String, String> allParams) throws IOException {
        return updateTopLevel(allParams, UPDATE_MUTABLE_SOURCE_SPARQL,
                (uri, value) -> Map.of("source", value));
    }

    public ResponseEntity<String> updateCitations(Map<String, String> allParams) throws IOException {
        return updateTopLevel(allParams, UPDATE_CITATIONS_SPARQL, (uri, value) -> {
            List<Integer> pubmedIds = citationService.parseCitationPubmedIds(value);
            return Map.of("insertCitations", citationInsertTriples(uri, pubmedIds));
        });
    }

    public ResponseEntity<String> editField(
            boolean isPublic,
            String userId,
            String collectionId,
            String displayId,
            String version,
            String field,
            Map<String, String> body) throws IOException {
        return mutateField(isPublic, userId, collectionId, displayId, version, field, body, FieldMutation.EDIT);
    }

    public ResponseEntity<String> addField(
            boolean isPublic,
            String userId,
            String collectionId,
            String displayId,
            String version,
            String field,
            Map<String, String> body) throws IOException {
        return mutateField(isPublic, userId, collectionId, displayId, version, field, body, FieldMutation.ADD);
    }

    public ResponseEntity<String> removeField(
            boolean isPublic,
            String userId,
            String collectionId,
            String displayId,
            String version,
            String field,
            Map<String, String> body) throws IOException {
        return mutateField(isPublic, userId, collectionId, displayId, version, field, body, FieldMutation.REMOVE);
    }

    private enum FieldMutation {
        EDIT, ADD, REMOVE
    }

    private ResponseEntity<String> updateTopLevel(
            Map<String, String> allParams,
            String sparqlTemplate,
            BiFunction<String, String, Map<String, String>> templateParams)
            throws IOException {
        String topLevelUri = allParams.get("uri");
        String value = allParams.get("value");
        if (!userService.isOwnedBy(topLevelUri)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        DateTimeFormatter dtf = ISODateTimeFormat.dateHourMinuteSecond();
        Map<String, String> args = new HashMap<>(templateParams.apply(topLevelUri, value));
        args.put("topLevel", topLevelUri);
        args.put("modified", dtf.print(DateTime.now()));

        String query = new SPARQLQuery(sparqlTemplate).loadTemplate(args);
        log.debug(query);
        updateInGraph(query, topLevelUri);

        return ResponseEntity.ok("Success");
    }

    private ResponseEntity<String> mutateField(
            boolean isPublic,
            String userId,
            String collectionId,
            String displayId,
            String version,
            String field,
            Map<String, String> body,
            FieldMutation mutation) throws IOException {
        String object = bodyValue(body, "object");
        String previous = bodyValue(body, "previous");
        String pred = bodyValue(body, "pred");

        if (object == null || object.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

        if (mutation == FieldMutation.ADD && "annotation".equals(field)
                && (pred == null || pred.isBlank())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        String predicate = resolvePredicate(field, mutation, pred);
        if (predicate == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        String subjectUri = buildSubjectUri(isPublic, userId, collectionId, displayId, version);

        if (!isPublic && !userService.isOwnedBy(subjectUri)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        if (isPublic && mutation == FieldMutation.REMOVE) {
            var removePublic = ConfigUtil.get("removePublicEnabled");
            if (removePublic == null || !removePublic.asBoolean()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
        }

        String sparqlTemplate = switch (mutation) {
            case EDIT -> UPDATE_TRIPLE_SPARQL;
            case ADD -> ADD_TRIPLE_SPARQL;
            case REMOVE -> REMOVE_TRIPLE_SPARQL;
        };

        DateTimeFormatter dtf = ISODateTimeFormat.dateHourMinuteSecond();
        Map<String, String> args = Map.of(
                "subject", sparqlIri(subjectUri),
                "predicate", sparqlIri(predicate),
                "previous", formatPrevious(field, mutation, previous),
                "object", formatObject(field, object),
                "modified", StringUtil.sparqlStringLiteral(dtf.print(DateTime.now())));

        String query = new SPARQLQuery(sparqlTemplate).loadTemplate(args);
        log.debug(query);

        try {
            updateInGraph(query, subjectUri);
        } catch (IOException e) {
            log.error("SPARQL field {} failed for {}", mutation, subjectUri, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }

        if (mutation == FieldMutation.REMOVE) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.ok(object);
    }

    private static String bodyValue(Map<String, String> body, String key) {
        if (body == null) {
            return null;
        }
        return body.get(key);
    }

    private static String buildSubjectUri(
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

    private static String resolvePredicate(String field, FieldMutation mutation, String predFromBody) {
        if ("annotation".equals(field)) {
            return (predFromBody == null || predFromBody.isBlank()) ? null : predFromBody;
        }
        if (mutation == FieldMutation.ADD && EDIT_LITERAL_FIELDS.contains(field)) {
            return null;
        }
        return FIELD_PREDICATES.get(field);
    }

    private static String formatPrevious(String field, FieldMutation mutation, String previous) {
        if (mutation != FieldMutation.EDIT) {
            return "?previous";
        }
        if (EDIT_LITERAL_FIELDS.contains(field)) {
            return "?previous";
        }
        return formatObject(field, previous);
    }

    private static String formatObject(String field, String value) {
        if (value == null || value.isBlank()) {
            return StringUtil.sparqlStringLiteral("");
        }
        if (IRI_FIELDS.contains(field)) {
            return sparqlIri(value);
        }
        if (!EDIT_LITERAL_FIELDS.contains(field)
                && (value.startsWith("http://") || value.startsWith("https://"))) {
            return sparqlIri(value);
        }
        return StringUtil.sparqlStringLiteral(value);
    }

    private static String sparqlIri(String uri) {
        return "<" + uri + ">";
    }

    private static String citationInsertTriples(String topLevelUri, List<Integer> pubmedIds) {
        return pubmedIds.stream()
                .map(id -> "    <" + topLevelUri + "> obo:OBI_0001617 "
                        + StringUtil.sparqlStringLiteral(String.valueOf(id)) + " .\n")
                .collect(Collectors.joining());
    }

    private void updateInGraph(String query, String topLevelUri) throws IOException {
        String graphUri = sparqlService.resolveGraphUriForTopLevel(topLevelUri);
        sparqlService.update(query, graphUri, false);
    }
}
