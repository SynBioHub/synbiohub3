package com.synbiohub.sbh3.services;

import com.synbiohub.sbh3.dao.SparqlService;
import com.synbiohub.sbh3.sparql.SPARQLQuery;
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
