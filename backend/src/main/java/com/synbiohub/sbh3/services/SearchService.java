package com.synbiohub.sbh3.services;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.synbiohub.sbh3.controllers.SearchController;
import com.synbiohub.sbh3.security.model.User;
import com.synbiohub.sbh3.sparql.SPARQLQuery;
import com.synbiohub.sbh3.utils.ConfigUtil;
import org.springframework.http.*;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.net.URI;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;

/**
 * Handles the business logic (parsing keys, formatting SPARQL, etc)
 * @see SearchController
 */
@Service
public class SearchService {

    /**
     * Returns the metadata for the object from the specified search query
     * @param allParams Key/Value pairs of the query
     * @return String containing SPARQL query
     */
    public String getMetadataQuerySPARQL(Map<String,String> allParams) throws IOException {
        SPARQLQuery searchQuery = new SPARQLQuery("src/main/java/com/synbiohub/sbh3/sparql/search.sparql");
        HashMap<String, String> sparqlArgs = new HashMap<>
                (Map.of("from", "", "criteria", "", "limit", "", "offset", ""));

        // Process search parameters
        for (Map.Entry<String, String> param : allParams.entrySet()) {
            // Set offset and limit of query
            if (param.getKey().equals("offset")) {
                sparqlArgs.replace("offset", "OFFSET " + param.getValue());
                sparqlArgs.replace("limit", "LIMIT 50"); // Default limit for queries without limit
            }

            else if (param.getKey().equals("limit")) {
                sparqlArgs.replace("limit", "LIMIT " + param.getValue());
            }
        }
        allParams.remove("offset"); // Remove this as we have already processed and it may mess up criteria string

        allParams.remove("limit");

        String criteriaString = getCriteriaString(allParams);
        sparqlArgs.replace("criteria", criteriaString);

        String userGraph = getPrivateGraph();
        if (!userGraph.isEmpty()) {
            String defaultGraph = ConfigUtil.get("defaultGraph").toString();
            sparqlArgs.replace("from", "FROM <" + defaultGraph.substring(1,defaultGraph.length()-1) + ">\nFROM NAMED <" + userGraph + ">");
        }

        return searchQuery.loadTemplate(sparqlArgs);
    }

    /**
     * Escapes a value for use inside a SPARQL double-quoted string literal.
     */
    private static String escapeSparqlStringLiteral(String raw) {
        if (raw == null) {
            return "";
        }
        StringBuilder sb = new StringBuilder(raw.length() + 16);
        for (int i = 0; i < raw.length(); i++) {
            char c = raw.charAt(i);
            switch (c) {
                case '\\' -> sb.append("\\\\");
                case '"' -> sb.append("\\\"");
                case '\n' -> sb.append("\\n");
                case '\r' -> sb.append("\\r");
                case '\t' -> sb.append("\\t");
                default -> sb.append(c);
            }
        }
        return sb.toString();
    }

    /**
     * Gets the criteria string for a SPARQL query
     * @param allParams Key/value pairs from GET request
     * @return SPARQL-compatible criteria string
     */
    private String getCriteriaString(Map<String, String> allParams) throws UnsupportedEncodingException {
        StringBuilder criteriaString = new StringBuilder();

        var paramMap = allParams.entrySet();

        // Take care of URL encoded string of params
        for (Map.Entry<String, String> param : paramMap) {
            if (paramMap.size() == 1 && param.getKey().contains("%")) {
                String params = URLDecoder.decode(param.getKey(), StandardCharsets.UTF_8.name());
                if (params.contains("&")) {
                    String[] splitParams = params.split("&");
                    for (String p:splitParams) {
                        String[] splitParams1 = p.split("=");
                        allParams.put(splitParams1[0], splitParams1[1]);
                    }
                    paramMap.remove(param);
                } else {
                    allParams.put(params, "");
                    paramMap.remove(param);
                }

            }
        }

        for (Map.Entry<String, String> param : paramMap) {

            // Search for "Created by.."
            if (param.getKey().equals("dc:creator")) {
                criteriaString.append("   ?subject ").append(param.getKey()).append(" '").append(param.getValue().substring(1, param.getValue().length() - 1)).append("' . ");
            }
            // Type of object to search for
            else if (param.getKey().equals("objectType")) {
                if (param.getValue().contains("Collection")) {
                    criteriaString.append("?subject a <http://sbols.org/v2#Collection> .");
                } else if (param.getValue().contains("Component")){
                    criteriaString.append("?subject a <http://sbols.org/v2#ComponentDefinition> .");
                } else if (param.getValue().contains("Sequence")){
                    criteriaString.append("?subject a <http://sbols.org/v2#Sequence> .");
                }
            } else if (param.getKey().equalsIgnoreCase("collection")) {
                criteriaString.append("?subject a <http://sbols.org/v2#Collection> .");
            } else if (param.getKey().equalsIgnoreCase("component")) {
                criteriaString.append("?subject a <http://sbols.org/v2#ComponentDefinition> .");
            } else if (param.getKey().equalsIgnoreCase("sequence")) {
                criteriaString.append("?subject a <http://sbols.org/v2#Sequence> .");
                if (param.getValue() != null && !param.getValue().isEmpty()) {
                    criteriaString.append(" ?subject sbol2:elements \"").append(escapeSparqlStringLiteral(param.getValue())).append("\" .");
                }
            } else if (param.getKey().equalsIgnoreCase("globalsequence")
                    && param.getValue() != null && !param.getValue().isEmpty()) {
                criteriaString.append("?subject sbol2:globalsequence \"").append(escapeSparqlStringLiteral(param.getValue())).append("\" .");
            }

            else if (param.getKey().equals("createdBefore")) {
                criteriaString.append("  ?subject dcterms:created ?cdate . FILTER (xsd:dateTime(?cdate) <= \"").append(param.getValue()).append("T23:59:59Z\"^^xsd:dateTime) ");
            } else if (param.getKey().equals("createdAfter")) {
                criteriaString.append("  ?subject dcterms:created ?cdate . FILTER (xsd:dateTime(?cdate) >= \"").append(param.getValue()).append("T00:00:00Z\"^^xsd:dateTime) ");
            } else if (param.getKey().equals("modifiedBefore")) {
                criteriaString.append("  ?subject dcterms:modified ?mdate . FILTER (xsd:dateTime(?mdate) <= \"").append(param.getValue()).append("T23:59:59Z\"^^xsd:dateTime) ");
            } else if (param.getKey().equals("modifiedAfter")) {
                criteriaString.append("  ?subject dcterms:modified ?mdate . FILTER (xsd:dateTime(?mdate) >= \"").append(param.getValue()).append("T00:00:00Z\"^^xsd:dateTime) ");
            }

            // search keyword
            else if (param.getValue().equals("")) {
//                String[] searchTerms = param.getKey().split("/[ ]+/");
                String[] searchTerms = param.getKey().split(" ");
                criteriaString.append("FILTER (");
                boolean andMode = true;
                boolean notMode = false;
                for (int i = 0; i < searchTerms.length; i++) {
                    switch (searchTerms[i]) {
                        case "and":
                            andMode = true;
                            continue;
                        case "or":
                            andMode = false;
                            continue;
                        case "not":
                            notMode = true;
                            continue;
                    }
                    if (i > 0) {
                        if (notMode) {
                            criteriaString.append("&& !");
                            notMode = false;
                        } else if (andMode) {
                            criteriaString.append("&&");
                            andMode = false;
                        } else {
                            criteriaString.append("||");
                        }
                    }
                    String criteria = "(CONTAINS(lcase(?displayId), lcase('%s'))||CONTAINS(lcase(?name), lcase('%s'))||CONTAINS(lcase(?description), lcase('%s')))";
                    criteriaString.append(String.format(criteria, searchTerms[i], searchTerms[i], searchTerms[i]).replace("/''/g", "'\\''"));
                }
                criteriaString.append(')');
            } else {
                criteriaString.append("   ?subject sbol2:").append(param.getKey()).append(" ").append(param.getValue()).append(" . ");
            }
        }
        return criteriaString.toString();
    }

    /**
     * Gets the count of a part
     * @param allParams Key/value pairs from GET request
     * @return Count of a part
     */
    public String getSearchCountSPARQL(Map<String,String> allParams) throws UnsupportedEncodingException {
        SPARQLQuery searchQuery = new SPARQLQuery("src/main/java/com/synbiohub/sbh3/sparql/searchCount.sparql");
        HashMap<String, String> sparqlArgs = new HashMap<>
                (Map.of("from", "", "criteria", ""));
        String criteriaString = getCriteriaString(allParams);
        sparqlArgs.replace("criteria", criteriaString);
        return searchQuery.loadTemplate(sparqlArgs);
    }

    /**
     * Gets the count of a type
     * @param type Type to get count of
     * @return Count of a type
     */
    public String getTypeCountSPARQL(String type) {
        SPARQLQuery searchQuery = new SPARQLQuery("src/main/java/com/synbiohub/sbh3/sparql/Count.sparql");
        HashMap<String, String> sparqlArgs = new HashMap<>
                (Map.of("type", type));
        return searchQuery.loadTemplate(sparqlArgs);
    }

    // TODO: Make sure this method (and others) are compatible with user authentication in the future
    public String getURISPARQL(String collectionInfo, String endpoint) throws IOException {
        // Initialize arguments to be parsed into SPARQL template
        SPARQLQuery searchQuery = new SPARQLQuery("src/main/java/com/synbiohub/sbh3/sparql/search.sparql");
        HashMap<String, String> sparqlArgs = new HashMap<>
                (Map.of("from", getPrivateGraph(), "criteria", "", "limit", "", "offset", ""));

        String URI = ConfigUtil.get("databasePrefix").asText() + collectionInfo;

        if (endpoint.equalsIgnoreCase("uses")) {
            sparqlArgs.replace("criteria", " { ?subject ?p <" + URI + "> } UNION { ?subject ?p ?use . ?use ?useP <" + URI + "> } ." +
                    " FILTER(?useP != <http://wiki.synbiohub.org/wiki/Terms/synbiohub#topLevel>) " +
                    "# USES");
        }

        else if (endpoint.equalsIgnoreCase("similar")) {
            // Make sure explorer is enabled
            if (ConfigUtil.get("useSBOLExplorer").asBoolean()) {
                // TODO: Use Explorer here
            }
        }

        else if (endpoint.equalsIgnoreCase("twins")) {
            sparqlArgs.replace("criteria", "   ?subject sbol2:sequence ?seq . ?seq sbol2:elements ?elements . <" + URI
                    + "> a sbol2:ComponentDefinition . <" + URI + "> sbol2:sequence ?seq2 . ?seq2 sbol2:elements ?elements2 . " +
                    "FILTER(?subject != <" + URI + "> && ?elements = ?elements2) # TWINS");
        }
        String userGraph = getPrivateGraph();
        if (!userGraph.isEmpty()) {
            sparqlArgs.replace("from", "FROM <" + userGraph + ">");
        }

        return searchQuery.loadTemplate(sparqlArgs);
    }

    /**
     * Gets the count of components that have the same sequence as the given URI (twins), using the same criteria as the "twins" endpoint.
     * @param collectionInfo Collection path portion of the URI
     * @return SPARQL query string that returns a single ?count binding
     */
    public String getTwinsCountSPARQL(String collectionInfo) throws IOException {
        SPARQLQuery searchQuery = new SPARQLQuery("src/main/java/com/synbiohub/sbh3/sparql/searchCount.sparql");
        HashMap<String, String> sparqlArgs = new HashMap<>
                (Map.of("from", "", "criteria", ""));

        String URI = ConfigUtil.get("databasePrefix").asText() + collectionInfo;

        // Same criteria as the "twins" endpoint
        sparqlArgs.replace("criteria", "   ?subject sbol2:sequence ?seq . ?seq sbol2:elements ?elements . <" + URI
                + "> a sbol2:ComponentDefinition . <" + URI + "> sbol2:sequence ?seq2 . ?seq2 sbol2:elements ?elements2 . " +
                "FILTER(?subject != <" + URI + "> && ?elements = ?elements2) # TWINS");

        String userGraph = getPrivateGraph();
        if (!userGraph.isEmpty()) {
            sparqlArgs.replace("from", "FROM <" + userGraph + ">");
        }

        return searchQuery.loadTemplate(sparqlArgs);
    }

    /**
     * Gets the count of objects that use the specified URI, using the same criteria as the "uses" endpoint.
     * @param collectionInfo Collection path portion of the URI
     * @return SPARQL query string that returns a single ?count binding
     */
    public String getUsesCountSPARQL(String collectionInfo) throws IOException {
        SPARQLQuery searchQuery = new SPARQLQuery("src/main/java/com/synbiohub/sbh3/sparql/searchCount.sparql");
        HashMap<String, String> sparqlArgs = new HashMap<>
                (Map.of("from", "", "criteria", ""));

        String URI = ConfigUtil.get("databasePrefix").asText() + collectionInfo;

        // Same criteria as the "uses" endpoint
        sparqlArgs.replace("criteria", " { ?subject ?p <" + URI + "> } UNION { ?subject ?p ?use . ?use ?useP <" + URI + "> } ." +
                " FILTER(?useP != <http://wiki.synbiohub.org/wiki/Terms/synbiohub#topLevel>) " +
                "# USES");

        String userGraph = getPrivateGraph();
        if (!userGraph.isEmpty()) {
            sparqlArgs.replace("from", "FROM <" + userGraph + ">");
        }

        return searchQuery.loadTemplate(sparqlArgs);
    }

    /**
     * Gets the count of objects that use the specified URI, using the same criteria as the "uses" endpoint.
     * @param collectionInfo Collection path portion of the URI
     * @return SPARQL query string that returns a single ?count binding
     */
    public String getSimilarCountSPARQL(String collectionInfo) throws IOException {
        SPARQLQuery searchQuery = new SPARQLQuery("src/main/java/com/synbiohub/sbh3/sparql/searchCount.sparql");
        HashMap<String, String> sparqlArgs = new HashMap<>
                (Map.of("from", "", "criteria", ""));

        String URI = ConfigUtil.get("databasePrefix").asText() + collectionInfo;

        //TODO: when SBOLExplorer works, turn this on to make it work (current sent to /uses and not /similar)
//        sparqlArgs.replace("criteria", " { ?subject ?p <" + URI + "> } UNION { ?subject ?p ?use . ?use ?useP <" + URI + "> } ." +
//                " FILTER(?useP != <http://wiki.synbiohub.org/wiki/Terms/synbiohub#topLevel>) " +
//                "# USES");

        String userGraph = getPrivateGraph();
        if (!userGraph.isEmpty()) {
            sparqlArgs.replace("from", "FROM <" + userGraph + ">");
        }

        return searchQuery.loadTemplate(sparqlArgs);
    }

//    public String getTwinsSPARQL(String collectionInfo) throws IOException {
//        SPARQLQuery searchQuery = new SPARQLQuery("src/main/java/com/synbiohub/sbh3/sparql/search.sparql");
//        HashMap<String, String> sparqlArgs = new HashMap<>
//                (Map.of("from", getPrivateGraph(), "criteria", "", "limit", "", "offset", ""));
//
//        String URI = ConfigUtil.get("databasePrefix").asText() + collectionInfo;
//
//        sparqlArgs.replace("criteria", " { ?subject ?p <" + URI + "> } UNION { ?subject ?p ?use . ?use ?useP <" + URI + "> } ." +
//                " FILTER(?useP != <http://wiki.synbiohub.org/wiki/Terms/synbiohub#topLevel>) " +
//                "# USES");
//
//        String userGraph = getPrivateGraph();
//        if (!userGraph.isEmpty()) {
//            sparqlArgs.replace("from", "FROM <" + userGraph + ">");
//        }
//
//        return searchQuery.loadTemplate(sparqlArgs);
//    }

    public String getRootCollectionsSPARQL() {
        SPARQLQuery searchQuery = new SPARQLQuery("src/main/java/com/synbiohub/sbh3/sparql/RootCollectionMetadata.sparql");
        return searchQuery.getQuery();
    }

    public String getSubCollectionsSPARQL(String collectionInfo) throws IOException {
        SPARQLQuery searchQuery = new SPARQLQuery("src/main/java/com/synbiohub/sbh3/sparql/SubCollectionMetadata.sparql");
        String IRI = "<" + ConfigUtil.get("databasePrefix").asText() + collectionInfo + ">";

        HashMap<String, String> sparqlArgs = new HashMap<>
                (Map.of("parentCollection", IRI));

        return searchQuery.loadTemplate(sparqlArgs);
    }

    /**
     * Converts JSON from a SPARQL query to the API-specified JSON format
     * @param rawJSON JSON from a SPARQL query
     * @return JSON as specified by the API
     * @throws JsonProcessingException
     */
    public String rawJSONToOutput(String rawJSON) throws JsonProcessingException {
        var mapper = new ObjectMapper();
        JsonNode rawTree = mapper.readTree(rawJSON);
        ArrayList<ObjectNode> listOfParts = new ArrayList<>();
        for(JsonNode node : rawTree.get("results").get("bindings")) {
            listOfParts.add(bindingToObjectNode(mapper, node));
        }
        return listOfParts.toString();
    }

    /**
     * One SPARQL JSON binding row → same object shape as {@link #rawJSONToOutput} (uri, displayId, defaults, etc.).
     */
    private ObjectNode bindingToObjectNode(ObjectMapper mapper, JsonNode node) {
        Set<String> keySet = new HashSet<>();
        node.fieldNames().forEachRemaining(keySet::add);

        ObjectNode part = sparqlBindingRowToObjectNodePreserveKeys(mapper, node);

        JsonNode uriVal = part.remove("subject");
        if (uriVal != null) {
            part.set("uri", uriVal);
        }
        if (!keySet.contains("name")) {
            part.set("name", part.get("displayId"));
        }
        if (!keySet.contains("description")) {
            part.put("description", "");
        }
        return part;
    }

    /** One binding row {@code {"var":{"value":"…"}} …} → object with same keys holding literal nodes. */
    private static ObjectNode sparqlBindingRowToObjectNodePreserveKeys(ObjectMapper mapper, JsonNode binding) {
        ObjectNode row = mapper.createObjectNode();
        binding.fields().forEachRemaining(entry -> {
            JsonNode cell = entry.getValue();
            if (cell.hasNonNull("value")) {
                row.set(entry.getKey(), cell.get("value"));
            }
        });
        return row;
    }

    private static JsonNode sparqlBindingsArray(ObjectMapper mapper, String rawSparqlJson) throws JsonProcessingException {
        return mapper.readTree(rawSparqlJson).path("results").path("bindings");
    }

    /**
     * Root collections from the default graph plus synthetic entries from {@code webOfRegistries} (uri prefix → instance URL).
     */
    public String getBrowseCollectionsJSON() throws IOException {
        ObjectMapper mapper = new ObjectMapper();
        String raw = SPARQLQuery(getRootCollectionsSPARQL());
        ArrayNode list = collectionBindingsToArrayNode(mapper, raw);
        enrichLocalBrowseEntries(list);
        appendWebOfRegistries(mapper, list);
        return mapper.writeValueAsString(list);
    }

    /**
     * Adds {@code url} (path after configured instance base) and {@code public} for local root collections only.
     */
    private void enrichLocalBrowseEntries(ArrayNode collections) throws IOException {
        for (JsonNode n : collections) {
            if (!n.isObject()) {
                continue;
            }
            ObjectNode row = (ObjectNode) n;
            String uri = row.path("uri").asText("");
            row.put("url", relativePathAfterInstanceBase(uri));
            row.put("public", isPublicCollectionUri(uri));
        }
    }

    private String relativePathAfterInstanceBase(String uri) throws IOException {
        if (uri == null || uri.isEmpty()) {
            return "/";
        }
        String db = withTrailingSlash(ConfigUtil.get("databasePrefix").asText().trim());
        if (!db.isEmpty() && uri.startsWith(db)) {
            return withLeadingSlash(uri.substring(db.length()));
        }
        String inst = withTrailingSlash(instanceUriPrefixForGraphs().trim());
        if (!inst.isEmpty() && uri.startsWith(inst)) {
            return withLeadingSlash(uri.substring(inst.length()));
        }
        try {
            String path = URI.create(uri).getPath();
            if (path != null && !path.isEmpty()) {
                return path.startsWith("/") ? path : "/" + path;
            }
        } catch (Exception ignored) {
        }
        return "/";
    }

    private static String withLeadingSlash(String relative) {
        if (relative == null || relative.isEmpty()) {
            return "/";
        }
        return relative.startsWith("/") ? relative : "/" + relative;
    }

    private static String withTrailingSlash(String base) {
        if (base.isEmpty()) {
            return base;
        }
        return base.endsWith("/") ? base : base + "/";
    }

    private static boolean isPublicCollectionUri(String uri) {
        if (uri == null || uri.isEmpty()) {
            return false;
        }
        if (uri.contains("/public/")) {
            return true;
        }
        if (uri.contains("/user/")) {
            return false;
        }
        return false;
    }

    private static ArrayNode collectionBindingsToArrayNode(ObjectMapper mapper, String rawJSON) throws JsonProcessingException {
        JsonNode rawTree = mapper.readTree(rawJSON);
        ArrayNode listOfParts = mapper.createArrayNode();
        for (JsonNode node : rawTree.get("results").get("bindings")) {
            ObjectNode part = mapper.createObjectNode();
            part.put("uri", node.has("Collection") ? node.get("Collection").get("value").asText() : "");
            part.put("name", node.has("name") ? node.get("name").get("value").asText() : "");
            part.put("description", node.has("description") ? node.get("description").get("value").asText() : "");
            part.put("displayId", node.has("displayId") ? node.get("displayId").get("value").asText() : "");
            part.put("version", node.has("version") ? node.get("version").get("value").asText() : "");
            listOfParts.add(part);
        }
        return listOfParts;
    }

    private void appendWebOfRegistries(ObjectMapper mapper, ArrayNode collections) throws IOException {
        JsonNode wor = ConfigUtil.get("webOfRegistries");
        if (wor == null || !wor.isObject() || wor.isEmpty()) {
            return;
        }
        Set<String> existingUris = new HashSet<>();
        for (JsonNode n : collections) {
            if (n.has("uri") && !n.get("uri").isNull()) {
                existingUris.add(n.get("uri").asText());
            }
        }
        wor.fields().forEachRemaining(entry -> {
            String uriPrefix = entry.getKey();
            if (existingUris.contains(uriPrefix)) {
                return;
            }
            String instanceUrl = entry.getValue().asText("");
            String name = displayNameForRegistry(uriPrefix, instanceUrl);
            ObjectNode row = mapper.createObjectNode();
            row.put("uri", uriPrefix);
            row.put("name", name);
            row.put("description", "");
            row.put("displayId", name);
            row.put("version", "");
            row.put("url", instanceUrl);
            row.put("public", true);
            row.put("remote", true);
            collections.add(row);
        });
    }

    private static String displayNameForRegistry(String uriPrefix, String instanceUrl) {
        try {
            String trimmed = uriPrefix.replaceAll("/+$", "");
            URI parsed = URI.create(trimmed);
            String path = parsed.getPath();
            if (path != null && path.length() > 1) {
                String[] segs = path.split("/");
                String last = segs[segs.length - 1];
                if (!last.isEmpty()) {
                    return last;
                }
            }
            if (parsed.getHost() != null) {
                return parsed.getHost();
            }
            if (instanceUrl != null && !instanceUrl.isEmpty()) {
                URI iu = URI.create(instanceUrl.replaceAll("/+$", ""));
                if (iu.getHost() != null) {
                    return iu.getHost();
                }
            }
        } catch (Exception ignored) {
        }
        return uriPrefix;
    }

    public String collectionToOutput(String rawJSON) throws JsonProcessingException {
        ObjectMapper mapper = new ObjectMapper();
        return mapper.writeValueAsString(collectionBindingsToArrayNode(mapper, rawJSON));
    }

    /**
     * Converts JSON from a SPARQL query to a single string containing the count of a part/type
     * @param rawJSON JSON from a SPARQL query
     * @return A single number specifying the count
     * @throws JsonProcessingException
     */
    public String JSONToCount(String rawJSON) throws JsonProcessingException {
        var mapper = new ObjectMapper();
        JsonNode rawData = mapper.readTree(rawJSON);
        String value = "";

            for(JsonNode node : rawData.get("results").get("bindings")) {
                value = node.get("count").get("value").asText();
            }
        return value;
    }

    public String SPARQLOrExplorerQuery(String query) throws IOException {
        RestTemplate restTemplate = new RestTemplate();
        String url;
        // Encoding the SPARQL query to be sent to Explorer/SPARQL
        HashMap<String, String> params = new HashMap<>();
        params.put("default-graph-uri", ConfigUtil.get("defaultGraph").asText());
        params.put("query", query);

        if (ConfigUtil.get("useSBOLExplorer").asBoolean() && query.length() > 0)
            url = ConfigUtil.get("SBOLExplorerEndpoint").asText()  + "?default-graph-uri={default-graph-uri}&query={query}&";
        else
            url = ConfigUtil.get("sparqlEndpoint").asText() + "?default-graph-uri={default-graph-uri}&query={query}&format=json&";

        return restTemplate.getForObject(url, String.class, params);
    }

    public String SPARQLQuery(String query) throws IOException {
        return SPARQLQuery(query, null);
    }

    public String SPARQLQuery(String query, String defaultGraphUri) throws IOException {
        RestTemplate restTemplate = new RestTemplate();
        HashMap<String, String> params = new HashMap<>();
        params.put("query", query);
        String graphUri = (defaultGraphUri == null || defaultGraphUri.isBlank())
                ? ConfigUtil.get("defaultGraph").asText()
                : defaultGraphUri;
        params.put("default-graph-uri", graphUri);
        String url = ConfigUtil.get("sparqlEndpoint").asText()
                + "?default-graph-uri={default-graph-uri}&query={query}&format=json&";

        return restTemplate.getForObject(url, String.class, params);
    }

    /**
     * CONSTRUCT against the configured public {@code defaultGraph} only.
     *
     * @see #SPARQLRDFXMLQuery(String, String)
     */
    public byte[] SPARQLRDFXMLQuery(String query) throws IOException {
        return SPARQLRDFXMLQuery(query, null);
    }

    /**
     * CONSTRUCT against Virtuoso.
     * <ul>
     *   <li><b>Public</b> resource URI: {@code default-graph-uri} is the configured public {@code defaultGraph}
     *       (unchanged from legacy behavior).</li>
     *   <li><b>User/private</b> resource URI: {@code default-graph-uri} is <em>omitted</em> from the HTTP URL; the
     *       query must include {@code FROM} for both public and user graphs (see {@link #fromClauseForPrivateFetch}).</li>
     * </ul>
     *
     * @param resourceUriForDefaultGraph object identity URI in the SPARQL template; null is treated as public
     */
    public byte[] SPARQLRDFXMLQuery(String query, String resourceUriForDefaultGraph) throws IOException {
        RestTemplate restTemplate = new RestTemplate();
        HashMap<String, String> params = new HashMap<>();
        params.put("query", query);
        params.put("format", "application/rdf+xml");

        String user = usernameFromUserResourceUri(resourceUriForDefaultGraph);
        boolean privateResource = user != null && !user.isBlank();

        String url;
        if (privateResource) {
            url = ConfigUtil.get("sparqlEndpoint").asText() + "?query={query}&format={format}";
        } else {
            params.put("default-graph-uri", ConfigUtil.get("defaultGraph").asText());
            url = ConfigUtil.get("sparqlEndpoint").asText()
                    + "?default-graph-uri={default-graph-uri}&query={query}&format={format}";
        }

        HttpHeaders headers = new HttpHeaders();
        headers.add("Accept", "*/*");
        HttpEntity<?> entity = new HttpEntity<>(headers);

        ResponseEntity<byte[]> response = restTemplate.exchange(url, HttpMethod.GET, entity, byte[].class, params);
        return response.getBody() != null ? response.getBody() : new byte[0];
    }

    /**
     * SPARQL {@code FROM} clause fragment for {@code FetchSBOLNonRecursive.sparql}:
     * empty for public URIs (use {@code default-graph-uri} on the request); for user-scoped URIs returns
     * {@code FROM <publicDefaultGraph> FROM <userNamedGraph>} so CONSTRUCT reads both graphs without
     * {@code default-graph-uri}.
     */
    public String fromClauseForPrivateFetch(String resourceUri) throws IOException {
        String user = usernameFromUserResourceUri(resourceUri);
        if (user == null || user.isBlank()) {
            return "";
        }
        String pub = ConfigUtil.get("defaultGraph").asText();
        String priv = instanceUriPrefixForGraphs() + "user/" + user;
        return "FROM <" + pub + "> FROM <" + priv + ">";
    }

    /** Base URL for RDF URIs; prefers {@code uriPrefix} when set, else {@code graphPrefix}. */
    private String instanceUriPrefixForGraphs() throws IOException {
        JsonNode n = ConfigUtil.get("uriPrefix");
        if (n != null && !n.isNull()) {
            String t = n.asText().trim();
            if (!t.isEmpty()) {
                return t.endsWith("/") ? t : t + "/";
            }
        }
        return ConfigUtil.get("graphPrefix").asText();
    }

    /**
     * Returns the username segment for URIs of the form {@code (graphPrefix|uriPrefix) + "user/" + username + "/..."}.
     */
    private String usernameFromUserResourceUri(String resourceUri) throws IOException {
        if (resourceUri == null || resourceUri.isBlank()) {
            return null;
        }
        String gpHead = ConfigUtil.get("graphPrefix").asText() + "user/";
        String uriPrefixHead = instanceUriPrefixForGraphs() + "user/";
        if (resourceUri.startsWith(gpHead)) {
            String rest = resourceUri.substring(gpHead.length());
            int slash = rest.indexOf('/');
            if (slash > 0) {
                return rest.substring(0, slash);
            }
        }
        if (!gpHead.equals(uriPrefixHead) && resourceUri.startsWith(uriPrefixHead)) {
            String rest = resourceUri.substring(uriPrefixHead.length());
            int slash = rest.indexOf('/');
            if (slash > 0) {
                return rest.substring(0, slash);
            }
        }
        return null;
    }

    /**
     * Hit the /sparql endpoint on other SBH instances (Web of Registries).
     * Aligns with {@link #SPARQLRDFXMLQuery}: CONSTRUCT needs {@code format} + default graph + permissive Accept;
     * {@code String} responses often end up null for RDF MIME types.
     */
    public byte[] queryOldSBHSparqlEndpoint(String WOREndpoint, String query) throws IOException {
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.add("Accept", "*/*");

        String base = WOREndpoint.endsWith("/") ? WOREndpoint.substring(0, WOREndpoint.length() - 1) : WOREndpoint;
        String remoteDefaultGraph = base + "/public";

        HashMap<String, String> params = new HashMap<>();
        params.put("default-graph-uri", remoteDefaultGraph);
        params.put("query", query);
        params.put("format", "application/rdf+xml");

        String url = base + "/sparql?default-graph-uri={default-graph-uri}&query={query}&format={format}";
        HttpEntity<?> entity = new HttpEntity<>(headers);

        ResponseEntity<byte[]> rest;
        try {
            rest = restTemplate.exchange(url, HttpMethod.GET, entity, byte[].class, params);
        } catch (HttpClientErrorException e) {
            int status = e.getStatusCode().value();
            // Remote registry may reject unauthenticated SPARQL (401) or content negotiation (406); treat as no data.
            if (status == HttpStatus.NOT_ACCEPTABLE.value() || status == HttpStatus.UNAUTHORIZED.value()) {
                return new byte[0];
            }
            throw e;
        }
        byte[] body = rest.getBody();
        return body != null && body.length > 0 ? body : new byte[0];
    }

    /**
     * {@code databasePrefix + "user/" + username}: legacy subject for predicates like {@code sbh:ownedBy} / share roots.
     */
    public String userSynbiohubMemberUri(String username) throws IOException {
        return ConfigUtil.get("databasePrefix").asText() + "user/" + username;
    }

    /**
     * Virtuoso named graph for RDF stored under this user's account ({@link User#getGraphUri()} when set,
     * otherwise derived from configured {@code graphPrefix} — same derivation as anonymous {@link #getPrivateGraph()}
     * would use after login).
     */
    public String resolveUserNamedGraphUri(User user) throws IOException {
        String g = user.getGraphUri();
        if (g != null && !g.isBlank()) {
            return g;
        }
        return ConfigUtil.get("graphPrefix").asText() + "user/" + user.getUsername();
    }

    /**
     * Gets the user's private graph.
     * @return Empty string if user is not logged in, otherwise returns their private graph.
     */
    public String getPrivateGraph() throws IOException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication instanceof AnonymousAuthenticationToken) return "";
        //var user = authentication.getPrincipal();
        return ConfigUtil.get("graphPrefix").asText() + "user/" + authentication.getName();
    }

    // Method to encode a string value using `UTF-8` encoding scheme
    private static String encodeValue(String value) {
        try {
            return URLEncoder.encode(value, StandardCharsets.UTF_8.toString());
        } catch (UnsupportedEncodingException ex) {
            throw new RuntimeException(ex.getCause());
        }
    }

    public String getManageSubmissionsSPARQL(String email, String username) throws IOException {
        SPARQLQuery searchQuery = new SPARQLQuery("src/main/java/com/synbiohub/sbh3/sparql/search.sparql");
        HashMap<String, String> sparqlArgs = new HashMap<>(
            Map.of("from", "", "criteria", "", "limit", "", "offset", ""));

        String ownedByUri = userSynbiohubMemberUri(username);
        String escapedEmail = escapeSparqlStringLiteral(email == null ? "" : email);

        String criteria =
            "?subject a sbol2:Collection . " +
            "{ ?subject synbiohub:uploadedBy \"" + escapedEmail + "\" } " +
            "UNION " +
            "{ ?subject sbh:ownedBy <" + ownedByUri + "> } " +
            "FILTER NOT EXISTS { ?otherCollection sbol2:member ?subject }";

        sparqlArgs.replace("criteria", criteria);
        return searchQuery.loadTemplate(sparqlArgs);
    }

    public String getSharedCanViewSPARQL(String userResourceUri) throws IOException {
        SPARQLQuery query = new SPARQLQuery("src/main/java/com/synbiohub/sbh3/sparql/GetSharedCanView.sparql");
        return query.loadTemplate(Map.of("userUri", userResourceUri));
    }

    public String getTopLevelMetadataSPARQL(String topLevelUri) throws IOException {
        SPARQLQuery query = new SPARQLQuery("src/main/java/com/synbiohub/sbh3/sparql/GetTopLevelMetadata.sparql");
        return query.loadTemplate(Map.of("uri", topLevelUri));
    }

    /**
     * Objects shared via {@code sbh:canView} triples stored in the viewer's named graph (legacy {@code /shared} JSON).
     */
    public ArrayNode getSharedObjectsJSON(User user) throws IOException, JsonProcessingException {
        ObjectMapper mapper = new ObjectMapper();
        ArrayNode out = mapper.createArrayNode();

        String databasePrefix = ConfigUtil.get("databasePrefix").asText();
        String userResourceUri = userSynbiohubMemberUri(user.getUsername());
        String userGraphUri = resolveUserNamedGraphUri(user);

        JsonNode saltNode = ConfigUtil.get("shareLinkSalt");
        String shareLinkSalt = (saltNode == null || saltNode.isNull()) ? "" : saltNode.asText();

        String canViewRaw = SPARQLQuery(getSharedCanViewSPARQL(userResourceUri), userGraphUri);
        JsonNode bindings = sparqlBindingsArray(mapper, canViewRaw);
        if (!bindings.isArray()) {
            return out;
        }

        for (JsonNode b : bindings) {
            JsonNode objSlot = b.path("object");
            if (!objSlot.hasNonNull("value")) {
                continue;
            }
            String sharedUri = objSlot.path("value").asText("");
            if (sharedUri.isEmpty()) {
                continue;
            }

            String metaGraphUri = graphUriFromSharedTopLevelUri(sharedUri, user);
            String metaRaw = SPARQLQuery(getTopLevelMetadataSPARQL(sharedUri), metaGraphUri);
            JsonNode metaBindings = sparqlBindingsArray(mapper, metaRaw);
            if (!metaBindings.isArray() || metaBindings.size() == 0) {
                continue;
            }

            ObjectNode row = sparqlBindingRowToObjectNodePreserveKeys(mapper, metaBindings.get(0));

            String pi = row.path("persistentIdentity").asText("");
            String version = row.path("version").asText("");
            String versionedUri = !pi.isEmpty() ? pi + "/" + version : sharedUri;

            row.put("uri", versionedUri);
            row.put("url", computeSharedListingBrowserPath(databasePrefix, versionedUri, shareLinkSalt));

            out.add(row);
        }

        return out;
    }

    public ArrayNode mergeManageResults(String publicRawJSON, String privateRawJSON) throws JsonProcessingException {
        ObjectMapper mapper = new ObjectMapper();
        ArrayNode results = mapper.createArrayNode();
        Set<String> seenUris = new HashSet<>();

        JsonNode publicBindings = sparqlBindingsArray(mapper, publicRawJSON);
        if (publicBindings.isArray()) {
            for (JsonNode node : publicBindings) {
                ObjectNode part = bindingToObjectNode(mapper, node);
                part.put("triplestore", "public");
                seenUris.add(part.get("uri").asText());
                results.add(part);
            }
        }

        JsonNode privateBindings = sparqlBindingsArray(mapper, privateRawJSON);
        if (privateBindings.isArray()) {
            for (JsonNode node : privateBindings) {
                ObjectNode part = bindingToObjectNode(mapper, node);
                if (!seenUris.contains(part.get("uri").asText())) {
                    part.put("triplestore", "private");
                    results.add(part);
                }
            }
        }

        return results;
    }

    /**
     * Legacy {@code getGraphUriFromTopLevelUri}: which Virtuoso graph holds metadata for a top-level RDF URI?
     */
    private String graphUriFromSharedTopLevelUri(String topLevelUri, User user) throws IOException {
        String databasePrefix = ConfigUtil.get("databasePrefix").asText();
        String defaultGraph = ConfigUtil.get("defaultGraph").asText();

        String publicStem = databasePrefix + "public/";
        if (topLevelUri.startsWith(publicStem)) {
            return defaultGraph;
        }

        String viewerGraph = resolveUserNamedGraphUri(user);
        if (topLevelUri.startsWith(viewerGraph)) {
            return viewerGraph;
        }

        int userSeg = topLevelUri.indexOf("/user/");
        if (userSeg >= 0) {
            int afterUserKw = userSeg + "/user/".length();
            int slashAfterName = topLevelUri.indexOf('/', afterUserKw);
            if (slashAfterName >= 0) {
                return topLevelUri.substring(0, slashAfterName);
            }
            return topLevelUri;
        }

        return defaultGraph;
    }

    /**
     * {@code '/' + strippedUri + '/' + sha1(...) + '/share'} (legacy {@code shared.js}).
     */
    private static String computeSharedListingBrowserPath(String databasePrefix, String versionedUri,
                                                           String shareLinkSalt) {
        String rel = versionedUri;
        if (!databasePrefix.isEmpty() && rel.startsWith(databasePrefix)) {
            rel = rel.substring(databasePrefix.length());
        }
        while (rel.startsWith("/")) {
            rel = rel.substring(1);
        }
        String token = shareLinkTokenSynbiohubHex(versionedUri, shareLinkSalt);
        return "/" + rel + "/" + token + "/share";
    }

    /** {@code SHA1_HEX('synbiohub_' + SHA1_HEX(versioned_uri_utf8) + shareLinkSalt)} per legacy Node hashes. */
    private static String shareLinkTokenSynbiohubHex(String versionedUri, String shareLinkSalt) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-1");
            String innerHex = bytesToSha1HexLower(md.digest(versionedUri.getBytes(StandardCharsets.UTF_8)));
            md.reset();
            String outerPayload = "synbiohub_" + innerHex + (shareLinkSalt == null ? "" : shareLinkSalt);
            return bytesToSha1HexLower(md.digest(outerPayload.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-1 not available", e);
        }
    }

    private static String bytesToSha1HexLower(byte[] digest) {
        StringBuilder sb = new StringBuilder(digest.length * 2);
        for (byte b : digest) {
            sb.append(String.format(Locale.US, "%02x", b & 0xff));
        }
        return sb.toString();
    }

}
