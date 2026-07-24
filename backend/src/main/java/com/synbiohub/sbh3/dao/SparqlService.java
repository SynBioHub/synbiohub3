package com.synbiohub.sbh3.dao;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.synbiohub.sbh3.repo.SparqlRepository;
import com.synbiohub.sbh3.sparql.SPARQLQuery;
import com.synbiohub.sbh3.utils.StringUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;
import com.synbiohub.sbh3.repo.SparqlRepository;
import com.synbiohub.sbh3.sparql.SPARQLQuery;
import com.synbiohub.sbh3.utils.ConfigUtil;
import com.synbiohub.sbh3.utils.JsonUtil;
import com.synbiohub.sbh3.utils.StringUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@Service
public class SparqlService {

    private final SparqlRepository sparqlRepository;
    private final ObjectMapper objectMapper;

    /**
     * Virtuoso DELETE templates return one row per batch; loop until nothing remains.
     * Legacy {@code sparql.deleteStaggered}.
     */
    public void deleteCollection(Map<String, String> params, String graphUri) throws IOException {
        deleteStaggered(sparqlRepository.REMOVE_COLLECTION_SPARQL, params, graphUri);
    }

    public void delete(Map<String, String> params, String graphUri) throws IOException {
        deleteStaggered(sparqlRepository.REMOVE_SPARQL, params, graphUri);
    }

    public void uploadGraphStore(String graphUri, Path file) throws IOException {
        sparqlRepository.save(graphUri, file);
    }

    public void uploadAttachment(Map<String, String> params, String graphUri) throws IOException {
        String query = new SPARQLQuery(sparqlRepository.ATTACHMENT_UPDATE_SPARQL).loadTemplate(params);
        sparqlRepository.update(query, graphUri, false);
    }

    public void update(String query, String graphUri, boolean jsonResults) throws IOException {
        sparqlRepository.update(query, graphUri, jsonResults);
    }

    private void deleteStaggered(String queryTemplate, Map<String, String> params, String graphUri) throws IOException {
        String query = new SPARQLQuery(queryTemplate).loadTemplate(params);
        while (true) {
            String raw = sparqlRepository.update(query, graphUri, true);
            JsonNode bindings = objectMapper.readTree(raw).path("results").path("bindings");
            if (!bindings.isArray() || bindings.isEmpty()) {
                break;
            }
            String msg = bindings.get(0).path("callret-0").path("value").asText("");
            if (msg.contains("nothing to do")) {
                break;
            }
        }
    }

    /** Maps existing {@code sbol:source} values (e.g. {@code file:foo.png}) to attachment URIs. */
    public Map<String, String> loadAttachmentSources(String collectionUri, String graphUri) throws IOException {
        String query = new SPARQLQuery(SparqlRepository.GET_ATTACHMENT_SOURCE_SPARQL)
                .loadTemplate(Map.of("uri", collectionUri));
        String raw = sparqlRepository.getQuery(query, graphUri);
        Map<String, String> sources = new HashMap<>();
        JsonNode bindings = objectMapper.readTree(raw).path("results").path("bindings");
        if (!bindings.isArray()) {
            return sources;
        }
        for (JsonNode row : bindings) {
            String source = row.path("source").path("value").asText(null);
            String attachment = row.path("attachment").path("value").asText(null);
            if (source != null && attachment != null) {
                sources.put(source, attachment);
            }
        }
        return sources;
    }

    public void attachUpload(Map<String, String> params, String graphUri, boolean jsonResults) throws IOException {
        String query = new SPARQLQuery(sparqlRepository.ATTACH_UPLOAD_SPARQL).loadTemplate(params);
        update(query, graphUri, false);
    }

    /** Replaces hash/size on an existing attachment when re-uploading the same {@code file:} source. */
    public void updateAttachment(String graphUri, String attachmentUri, String uploadHash, long size)
            throws IOException {
        String query = new SPARQLQuery(sparqlRepository.UPDATE_ATTACHMENT_SPARQL).loadTemplate(Map.of(
                "attachmentURI", attachmentUri,
                "attachmentSource", attachmentUri + "/download",
                "hash", StringUtil.sparqlStringLiteral(uploadHash),
                "size", StringUtil.sparqlStringLiteral(Long.toString(size))));
        update(query, graphUri, false);
    }

    private final JsonUtil jsonUtil;

    public Map<String, String> buildSearchQuery(Map<String, String> allParams) {
        HashMap<String, String> sparqlArgs = new HashMap<>
                (Map.of("from", "", "criteria", "", "limit", "", "offset", ""));

        // Process search parameters
        for (Map.Entry<String, String> param : allParams.entrySet()) {
            // Set offset and limit of query
            if (param.getKey().equals("offset")) {
                sparqlArgs.replace("offset", "OFFSET " + param.getValue());
                sparqlArgs.replace("limit", "LIMIT 50"); // Default limit for queries without limit
            } else if (param.getKey().equals("limit")) {
                sparqlArgs.replace("limit", "LIMIT " + param.getValue());
            }
        }

        return sparqlArgs;

    }

    public String read(String url, String uri, String query) throws IOException {
        return sparqlRepository.executeReadQuery(url, uri, query);
    }

    /**
     * Returns the metadata for the object from the specified search query
     *
     * @param allParams Key/Value pairs of the query
     * @return String containing SPARQL query
     */
    public String getMetadataQuerySPARQL(Map<String, String> allParams) throws IOException {
        Map<String, String> sparqlArgs = buildSearchQuery(allParams);

        allParams.remove("offset"); // Remove this as we have already processed and it may mess up criteria string
        allParams.remove("limit");

        return loadSearchSPARQL(
                getCriteriaString(allParams),
                fromClauseForMetadataSearch(),
                sparqlArgs.get("limit"),
                sparqlArgs.get("offset"));
    }

    public String loadSearchSPARQL(String criteria, String fromClause, String limit, String offset) {
        HashMap<String, String> sparqlArgs = new HashMap<>(Map.of(
                "from", fromClause != null ? fromClause : "",
                "criteria", criteria != null ? criteria : "",
                "limit", limit != null ? limit : "",
                "offset", offset != null ? offset : ""));
        return new SPARQLQuery(sparqlRepository.SEARCH_SPARQL).loadTemplate(sparqlArgs);
    }

    private String loadSearchCountSPARQL(String criteria, String fromClause) {
        HashMap<String, String> sparqlArgs = new HashMap<>(Map.of(
                "from", fromClause != null ? fromClause : "",
                "criteria", criteria != null ? criteria : ""));
        return new SPARQLQuery(sparqlRepository.SEARCH_COUNT_SPARQL).loadTemplate(sparqlArgs);
    }

    /**
     * Gets the criteria string for a SPARQL query
     *
     * @param allParams Key/value pairs from GET request
     * @return SPARQL-compatible criteria string
     */
    public String getCriteriaString(Map<String, String> allParams) throws IOException {
        Map<String, String> templates =
                jsonUtil.readStringMapFromClasspath("searchCriteriaTemplate.json");

        return allParams.entrySet().stream()
                .map(param -> criteriaForParam(param, templates))
                .filter(Objects::nonNull)
                .collect(Collectors.joining());
    }

    private String criteriaForParam(
            Map.Entry<String, String> param,
            Map<String, String> templates) {

        String key = param.getKey();
        if ("keyword".equalsIgnoreCase(key)) {
            return buildKeywordFilter(param.getValue());
        }

        if (!templates.containsKey(key)) {
            key = "default";
        }

        return templates.get(key)
                .replace("$key", key)
                .replace("$escapedValue", StringUtil.escapeSparqlStringLiteral(param.getValue()))
                .replace("$value", param.getValue());
    }

    private String buildKeywordFilter(String keywords) {
        if (keywords == null || keywords.isBlank()) {
            return "";
        }
        String[] searchTerms = keywords.trim().split("\\s+");
        StringBuilder sb = new StringBuilder("FILTER (");
        String termCriteria =
                "(CONTAINS(lcase(?displayId), lcase(\"%s\"))||CONTAINS(lcase(?name), lcase(\"%s\"))||CONTAINS(lcase(?description), lcase(\"%s\")))";

        for (int i = 0; i < searchTerms.length; i++) {
            if (searchTerms[i].isEmpty()) {
                continue;
            }
            if (sb.length() > "FILTER (".length()) {
                sb.append("||");
            }
            String escaped = StringUtil.escapeSparqlStringLiteral(searchTerms[i]);
            sb.append(String.format(termCriteria, escaped, escaped, escaped));
        }
        sb.append(')');
        return sb.toString();
    }

    /**
     * Logged-in metadata search: public default graph + user's named graph.
     */
    private String fromClauseForMetadataSearch() throws IOException {
        String userGraph = getPrivateGraph();
        if (userGraph.isEmpty()) {
            return "";
        }
        String defaultGraph = ConfigUtil.get("defaultGraph").asText();
        return "FROM <" + defaultGraph + ">\nFROM <" + userGraph + ">";
    }

    /**
     * URI relationship endpoints: user's private graph only when logged in.
     */
    private String fromClauseForUriSearch() throws IOException {
        String userGraph = getPrivateGraph();
        if (userGraph.isEmpty()) {
            return "";
        }
        return "FROM <" + userGraph + ">";
    }

    /**
     * Gets the user's private graph.
     *
     * @return Empty string if user is not logged in, otherwise returns their private graph.
     */
    public String getPrivateGraph() throws IOException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication instanceof AnonymousAuthenticationToken) return "";
        //var user = authentication.getPrincipal();
        return ConfigUtil.get("graphPrefix").asText() + "user/" + authentication.getName();
    }

    /**
     * Gets the count of a part
     *
     * @param allParams Key/value pairs from GET request
     * @return Count of a part
     */
    public String getSearchCountSPARQL(Map<String, String> allParams) throws IOException {
        return loadSearchCountSPARQL(getCriteriaString(allParams), "");
    }

    /**
     * SPARQL for twins / similar / uses around a single object URI ({@code search.sparql}).
     */
    public String getURISPARQL(String collectionInfo, String endpoint) throws IOException {
        return loadSearchSPARQL(
                uriRelationshipCriteria(collectionInfo, endpoint),
                fromClauseForUriSearch(),
                "",
                "");
    }

    private String uriRelationshipCriteria(String collectionInfo, String endpoint) throws IOException {
        String uri = objectUri(collectionInfo);
        if (endpoint.equalsIgnoreCase("uses")) {
            return usesCriteria(uri);
        }
        if (endpoint.equalsIgnoreCase("twins")) {
            return twinsCriteria(uri);
        }
        if (endpoint.equalsIgnoreCase("similar") && ConfigUtil.get("useSBOLExplorer").asBoolean()) {
            // TODO: Use Explorer here
        }
        return "";
    }

    private String objectUri(String collectionInfo) throws IOException {
        return ConfigUtil.get("databasePrefix").asText() + collectionInfo;
    }

    private static String usesCriteria(String uri) {
        return " { ?subject ?p <" + uri + "> } UNION { ?subject ?p ?use . ?use ?useP <" + uri + "> } ."
                + " FILTER(?useP != <http://wiki.synbiohub.org/wiki/Terms/synbiohub#topLevel>) "
                + "# USES";
    }

    private static String twinsCriteria(String uri) {
        return "   ?subject sbol2:sequence ?seq . ?seq sbol2:elements ?elements . <" + uri
                + "> a sbol2:ComponentDefinition . <" + uri + "> sbol2:sequence ?seq2 . ?seq2 sbol2:elements ?elements2 . "
                + "FILTER(?subject != <" + uri + "> && ?elements = ?elements2) # TWINS";
    }

    /**
     * Gets the count of components that have the same sequence as the given URI (twins), using the same criteria as the "twins" endpoint.
     *
     * @param collectionInfo Collection path portion of the URI
     * @return SPARQL query string that returns a single ?count binding
     */
    public String getTwinsCountSPARQL(String collectionInfo) throws IOException {
        return loadSearchCountSPARQL(twinsCriteria(objectUri(collectionInfo)), fromClauseForUriSearch());
    }

    /**
     * Gets the count of objects that use the specified URI, using the same criteria as the "uses" endpoint.
     *
     * @param collectionInfo Collection path portion of the URI
     * @return SPARQL query string that returns a single ?count binding
     */
    public String getUsesCountSPARQL(String collectionInfo) throws IOException {
        return loadSearchCountSPARQL(usesCriteria(objectUri(collectionInfo)), fromClauseForUriSearch());
    }

    /**
     * Gets the count of objects that use the specified URI, using the same criteria as the "uses" endpoint.
     *
     * @param collectionInfo Collection path portion of the URI
     * @return SPARQL query string that returns a single ?count binding
     */
    public String getSimilarCountSPARQL(String collectionInfo) throws IOException {
        // TODO: when SBOLExplorer works, turn this on to make it work (current sent to /uses and not /similar)
        return loadSearchCountSPARQL("", fromClauseForUriSearch());
    }

    public String getRootCollectionsSPARQL() {
        SPARQLQuery searchQuery = new SPARQLQuery(sparqlRepository.ROOT_COLLECTION_METADATA_SPARQL);
        return searchQuery.getQuery();
    }

    public String getSubCollectionsSPARQL(String collectionInfo) throws IOException {
        SPARQLQuery searchQuery = new SPARQLQuery(sparqlRepository.SUBCOLLECTION_METADATA_SPARQL);
        String IRI = "<" + ConfigUtil.get("databasePrefix").asText() + collectionInfo + ">";

        HashMap<String, String> sparqlArgs = new HashMap<>
                (Map.of("parentCollection", IRI));

        return searchQuery.loadTemplate(sparqlArgs);
    }

    /**
     * Derives sparql-auth URL from config (explicit or inferred from sparqlEndpoint).
     */
    public String sparqlQueryUrl() throws IOException {
        return ConfigUtil.get("sparqlEndpoint").asText()
                + "?default-graph-uri={default-graph-uri}&query={query}&format=json&";
    }

    public String explorerQueryUrl() throws IOException {
        return ConfigUtil.get("SBOLExplorerEndpoint").asText()
                + "?default-graph-uri={default-graph-uri}&query={query}&";
    }

    public String resolveGraphUri(String defaultGraphUri) throws IOException {
        if (defaultGraphUri == null || defaultGraphUri.isBlank()) {
            return ConfigUtil.get("defaultGraph").asText();
        }
        return defaultGraphUri;
    }

    public String getExplorerUrl() throws IOException {
        if (ConfigUtil.get("useSBOLExplorer").asBoolean()) {
            return explorerQueryUrl();
        } else {
            return sparqlQueryUrl();
        }
    }

    /**
     * Gets the count of a type
     *
     * @param type Type to get count of
     * @return Count of a type
     */
    public String getTypeCountSPARQL(String type) {
        SPARQLQuery searchQuery = new SPARQLQuery(sparqlRepository.COUNT_SPARQL);
        HashMap<String, String> sparqlArgs = new HashMap<>
                (Map.of("type", type));
        return searchQuery.loadTemplate(sparqlArgs);
    }

    public String getManageSubmissionsSPARQL(String email, String username) throws IOException {
        SPARQLQuery searchQuery = new SPARQLQuery(sparqlRepository.SEARCH_SPARQL);
        HashMap<String, String> sparqlArgs = new HashMap<>(
                Map.of("from", "", "criteria", "", "limit", "", "offset", ""));

        String ownedByUri = userSynbiohubMemberUri(username);
        String escapedEmail = StringUtil.escapeSparqlStringLiteral(email == null ? "" : email);

        String criteria =
                "?subject a sbol2:Collection . " +
                        "{ ?subject synbiohub:uploadedBy \"" + escapedEmail + "\" } " +
                        "UNION " +
                        "{ ?subject sbh:ownedBy <" + ownedByUri + "> } " +
                        "FILTER NOT EXISTS { ?otherCollection sbol2:member ?subject }";

        sparqlArgs.replace("criteria", criteria);
        return searchQuery.loadTemplate(sparqlArgs);
    }

    /**
     * {@code databasePrefix + "user/" + username}: legacy subject for predicates like {@code sbh:ownedBy} / share roots.
     */
    public String userSynbiohubMemberUri(String username) throws IOException {
        return ConfigUtil.get("databasePrefix").asText() + "user/" + username;
    }

    public String getSharedCanViewSPARQL(String userResourceUri) throws IOException {
        SPARQLQuery query = new SPARQLQuery(sparqlRepository.SHARED_VIEW_SPARQL);
        return query.loadTemplate(Map.of("userUri", userResourceUri));
    }

    public String getTopLevelMetadataSPARQL(String topLevelUri) throws IOException {
        SPARQLQuery query = new SPARQLQuery(sparqlRepository.TOPLEVEL_METADATA_SPARQL);
        return query.loadTemplate(Map.of("uri", topLevelUri));
    }
}
