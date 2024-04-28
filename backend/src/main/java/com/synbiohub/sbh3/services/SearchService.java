package com.synbiohub.sbh3.services;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.synbiohub.sbh3.controllers.SearchController;
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

    public String getTwinsSPARQL(String collectionInfo) throws IOException {
        SPARQLQuery searchQuery = new SPARQLQuery("src/main/java/com/synbiohub/sbh3/sparql/search.sparql");
        HashMap<String, String> sparqlArgs = new HashMap<>
                (Map.of("from", getPrivateGraph(), "criteria", "", "limit", "", "offset", ""));

        String URI = ConfigUtil.get("databasePrefix").asText() + collectionInfo;

        sparqlArgs.replace("criteria", " { ?subject ?p <" + URI + "> } UNION { ?subject ?p ?use . ?use ?useP <" + URI + "> } ." +
                " FILTER(?useP != <http://wiki.synbiohub.org/wiki/Terms/synbiohub#topLevel>) " +
                "# USES");

        String userGraph = getPrivateGraph();
        if (!userGraph.isEmpty()) {
            sparqlArgs.replace("from", "FROM <" + userGraph + ">");
        }

        return searchQuery.loadTemplate(sparqlArgs);
    }

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
            ObjectNode part = mapper.createObjectNode();
            Set<String> keySet = new HashSet<>();
            for (Iterator<Map.Entry<String, JsonNode>> it = node.fields(); it.hasNext(); ) {
                Map.Entry<String, JsonNode> subNode = it.next();
                part.set((subNode.getKey().equals("subject")? "uri" : subNode.getKey()), subNode.getValue().get("value"));
                keySet.add(subNode.getKey());
            }
            if (!keySet.contains("name")) {
                part.set("name", part.get("displayId"));
            }
            if (!keySet.contains("description")) {
                part.put("description", "");
            }
            listOfParts.add(part);
        }
        return listOfParts.toString();
    }

    public String collectionToOutput(String rawJSON) throws JsonProcessingException{
        var mapper = new ObjectMapper();
        JsonNode rawTree = mapper.readTree(rawJSON);
        ArrayList<ObjectNode> listOfParts = new ArrayList<>();
        for(JsonNode node : rawTree.get("results").get("bindings")) {
            ObjectNode part = mapper.createObjectNode();

            part.put("uri", (node.has("Collection") ? node.get("Collection").get("value").asText() : ""));
            part.put("name", (node.has("name") ? node.get("name").get("value").asText() : ""));
            part.put("description", (node.has("description") ? node.get("description").get("value").asText() : ""));
            part.put("displayId", (node.has("displayId") ? node.get("displayId").get("value").asText() : ""));
            part.put("version", (node.has("version") ? node.get("version").get("value").asText() : ""));
            listOfParts.add(part);
        }
        return listOfParts.toString();
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
        RestTemplate restTemplate = new RestTemplate();
        String url;
        HashMap<String, String> params = new HashMap<>();
        params.put("default-graph-uri", ConfigUtil.get("defaultGraph").asText());
        params.put("query", query);

        url = ConfigUtil.get("sparqlEndpoint").asText() + "?default-graph-uri={default-graph-uri}&query={query}&format=json&";
//        url = ConfigUtil.get("sparqlEndpoint").asText() + "?default-graph-uri={default-graph-uri}&query={query}";
        // has to be the first one. without format json, getting root collections fails

        return restTemplate.getForObject(url, String.class, params);
    }

    public byte[] SPARQLRDFXMLQuery(String query) throws IOException {
        RestTemplate restTemplate = new RestTemplate();
        String url;
        HashMap<String, String> params = new HashMap<>();
        params.put("default-graph-uri", ConfigUtil.get("defaultGraph").asText());
        params.put("query", query);
        params.put("format", "application/rdf+xml");
        HttpHeaders httpHeaders = new HttpHeaders();
        httpHeaders.add("Accept", "application/rdf+xml");
        HttpEntity entity = new HttpEntity(httpHeaders);

        url = ConfigUtil.get("sparqlEndpoint").asText() + "?default-graph-uri={default-graph-uri}&query={query}";

        var rest = restTemplate.exchange(url, HttpMethod.GET, entity, byte[].class, params);
        return rest.getBody();
    }

    /**
     * Hit the /sparql endpoint on other SBH instances
     * @param query SPARQL Query to send
     * @return JSON representation of results
     */
    public byte[] queryOldSBHSparqlEndpoint(String WOREndpoint, String query) throws IOException {
        RestTemplate restTemplate = new RestTemplate();
        String url;
        HashMap<String, String> params = new HashMap<>();
//        params.put("default-graph-uri", ConfigUtil.get("defaultGraph").asText());
        params.put("query", query);
        params.put("format", "application/rdf+xml");
        HttpHeaders httpHeaders = new HttpHeaders();
//        httpHeaders.add("Accept", "application/json");
        httpHeaders.add("Accept", "application/rdf+xml");
        HttpEntity entity = new HttpEntity<>("body", httpHeaders);

//        url = WOREndpoint + "/sparql?query="+query;
//        var result = restTemplate.getForObject(url, String.class);
//        url = WOREndpoint + "/sparql?default-graph-uri={default-graph-uri}&query={query}";
        url = WOREndpoint + "/sparql?query={query}";
        ResponseEntity<String> rest;
        try {
            rest = restTemplate.getForEntity(url, String.class, entity);
        } catch (HttpClientErrorException e) {
            if (e.getStatusCode() == HttpStatus.NOT_ACCEPTABLE) {
                byte[] emptyByteArray = new byte[0];
                return emptyByteArray;
            } else {
                throw e;
            }
        }
        return rest.getBody().getBytes(StandardCharsets.UTF_8);
    }

    /**
     * Gets the user's private graph.
     * @return Empty string if user is not logged in, otherwise returns their private graph.
     */
    public String getPrivateGraph() throws IOException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication instanceof AnonymousAuthenticationToken) return "";
        //var user = authentication.getPrincipal();
        return ConfigUtil.get("graphPrefix").asText() + "/user/" + authentication.getName();
    }

    // Method to encode a string value using `UTF-8` encoding scheme
    private static String encodeValue(String value) {
        try {
            return URLEncoder.encode(value, StandardCharsets.UTF_8.toString());
        } catch (UnsupportedEncodingException ex) {
            throw new RuntimeException(ex.getCause());
        }
    }

}
