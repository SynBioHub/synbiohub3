package com.synbiohub.sbh3.search;

 import com.fasterxml.jackson.core.JsonProcessingException;
 import com.fasterxml.jackson.databind.JsonNode;
 import com.fasterxml.jackson.databind.ObjectMapper;
 import com.fasterxml.jackson.databind.node.ObjectNode;
 import com.synbiohub.sbh3.sparql.SPARQLQuery;
 import org.springframework.beans.factory.annotation.Autowired;
 import org.springframework.stereotype.Service;

 import javax.servlet.http.HttpServletRequest;
 import java.util.ArrayList;
 import java.util.HashMap;
 import java.util.List;
 import java.util.Map;

/**
 * Handles the business logic (parsing keys, formatting SPARQL, etc)
 * @see SearchController
 */
@Service
public class SearchService {

    @Autowired
    JsonNode config;

    @Autowired
    ObjectMapper mapper;

    /**
     * Returns the metadata for the object from the specified search query
     * @param allParams Key/Value pairs of the query
     * @return String containing SPARQL query
     * @see SearchController#getResults(Map, HttpServletRequest)
     */
    public String getMetadataQuerySPARQL(Map<String,String> allParams) {
        SPARQLQuery searchQuery = new SPARQLQuery("src/main/java/com/synbiohub/sbh3/sparql/search.sparql");
        HashMap<String, String> sparqlArgs = new HashMap<String, String>
                (Map.of("from", "", "criteria", "", "limit", "", "offset", ""));

        // Process search parameters
        for (Map.Entry<String, String> param : allParams.entrySet()) {
            // Set offset and limit of query
            if (param.getKey().equals("offset")) {
                sparqlArgs.replace("offset", "OFFSET " + param.getValue());
                allParams.remove("offset"); // Remove this as we have already processed and it may mess up criteria string
                sparqlArgs.replace("limit", "LIMIT 50"); // Default limit for queries without limit
                continue;
            }

            else if (param.getKey().equals("limit")) {
                sparqlArgs.replace("limit", "LIMIT " + param.getValue());
                allParams.remove("limit");
                continue;
            }
        }

        String criteriaString = getCriteriaString(allParams);
        sparqlArgs.replace("criteria", criteriaString);

        return searchQuery.loadTemplate(sparqlArgs);
    }

    /**
     * Gets the criteria string for a SPARQL query
     * @param params Key/value pairs from GET request
     * @return SPARQL-compatible criteria string
     */
    private String getCriteriaString(Map<String, String> params) {
        String criteriaString = "";
        for (Map.Entry<String, String> param : params.entrySet()) {

            // A tag in the dcterms namespace to search for
            if (param.getKey().contains(":")) {
                criteriaString += "   ?subject " + param.getKey() + " " + param.getValue() + " . ";
            }
            // Type of object to search for
            else if (param.getKey().equals("objectType")) {
                if (param.getValue().contains(":")) {
                    criteriaString += "   ?subject a " + param.getValue() + " . ";
                } else {
                    criteriaString += "   ?subject a sbol2:" + param.getValue() + " . ";
                }
            } else if (param.getKey().equals("collection")) {
                criteriaString += "   ?collection a sbol2:Collection .   " + param.getValue() + " sbol2:member ?subject .";
            } else if (param.getKey().equals("createdBefore")) {
                criteriaString += "   FILTER (xsd:dateTime(?cdate) <= \"" + param.getValue() + "T23:59:59Z\"^^xsd:dateTime) ";
            } else if (param.getKey().equals("createdAfter")) {
                criteriaString += "   FILTER (xsd:dateTime(?cdate) >= \"" + param.getValue() + "T00:00:00Z\"^^xsd:dateTime) ";
            } else if (param.getKey().equals("modifiedBefore")) {
                criteriaString += "   FILTER (xsd:dateTime(?mdate) <= \"" + param.getValue() + "T23:59:59Z\"^^xsd:dateTime) ";
            } else if (param.getKey().equals("modifiedAfter")) {
                criteriaString += "   FILTER (xsd:dateTime(?mdate) >= \"" + param.getValue() + "T00:00:00Z\"^^xsd:dateTime) ";
            }

            // search keyword
            else if (param.getValue().equals("")) {
                String[] searchTerms = param.getKey().split("/[ ]+/");
                criteriaString += "FILTER (";
                boolean andMode = true;
                boolean notMode = false;
                for (int i = 0; i < searchTerms.length; i++) {
                    if (searchTerms[i].equals("and")) {
                        andMode = true;
                        continue;
                    } else if (searchTerms[i].equals("or")) {
                        andMode = false;
                        continue;
                    } else if (searchTerms[i].equals("not")) {
                        notMode = true;
                        continue;
                    }
                    if (i > 0) {
                        if (andMode) {
                            criteriaString += "&&";
                            andMode = false;
                        } else {
                            criteriaString += "||";
                        }
                    }
                    if (notMode) {
                        criteriaString += " !";
                    }
                    String criteria = "(CONTAINS(lcase(?displayId), lcase(\'%s\'))||CONTAINS(lcase(?name), lcase(\'%s\'))||CONTAINS(lcase(?description), lcase(\'%s\')))";
                    criteriaString += String.format(criteria, searchTerms[i], searchTerms[i], searchTerms[i]).replace("/''/g", "'\\\''");
                }
                criteriaString += ')';
            } else {
                criteriaString += "   ?subject sbol2:" + param.getKey() + " " + param.getValue() + " . ";
            }
        }
        return criteriaString;
    }

    /**
     * Gets the count of a part
     * @param allParams Key/value pairs from GET request
     * @return Count of a part
     */
    public String getSearchCountSPARQL(Map<String,String> allParams) {
        SPARQLQuery searchQuery = new SPARQLQuery("src/main/java/com/synbiohub/sbh3/sparql/searchCount.sparql");
        HashMap<String, String> sparqlArgs = new HashMap<String, String>
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
        HashMap<String, String> sparqlArgs = new HashMap<String, String>
                (Map.of("type", type));
        return searchQuery.loadTemplate(sparqlArgs);
    }

    // TODO: Make sure this method (and others) are compatible with user authentication in the future
    public String getURISPARQL(String collectionInfo, String endpoint) {
        // Initialize arguments to be parsed into SPARQL template
        SPARQLQuery searchQuery = new SPARQLQuery("src/main/java/com/synbiohub/sbh3/sparql/search.sparql");
        HashMap<String, String> sparqlArgs = new HashMap<String, String>
                (Map.of("from", "", "criteria", "", "limit", "", "offset", ""));

        String URI = config.get("databasePrefix").asText() + collectionInfo;

        if (endpoint.equalsIgnoreCase("uses")) {
            sparqlArgs.replace("criteria", " { ?subject ?p <" + URI + "> } UNION { ?subject ?p ?use . ?use ?useP <" + URI + "> } ." +
                    " FILTER(?useP != <http://wiki.synbiohub.org/wiki/Terms/synbiohub#topLevel>) " +
                    "# USES");
        }

        else if (endpoint.equalsIgnoreCase("similar")) {
            // Make sure explorer is enabled
            if (config.get("useSBOLExplorer").asBoolean()) {

            }
        }

        else if (endpoint.equalsIgnoreCase("twins")) {
            sparqlArgs.replace("criteria", "   ?subject sbol2:sequence ?seq . ?seq sbol2:elements ?elements . <" + URI
                    + "> a sbol2:ComponentDefinition . <" + URI + "> sbol2:sequence ?seq2 . ?seq2 sbol2:elements ?elements2 . " +
                    "FILTER(?subject != <" + URI + "> && ?elements = ?elements2) # TWINS");
        }

        return searchQuery.loadTemplate(sparqlArgs);
    }

    public String getTwinsSPARQL(String collectionInfo) {
        SPARQLQuery searchQuery = new SPARQLQuery("src/main/java/com/synbiohub/sbh3/sparql/search.sparql");
        HashMap<String, String> sparqlArgs = new HashMap<String, String>
                (Map.of("from", "", "criteria", "", "limit", "", "offset", ""));

        String URI = config.get("databasePrefix").asText() + collectionInfo;

        sparqlArgs.replace("criteria", " { ?subject ?p <" + URI + "> } UNION { ?subject ?p ?use . ?use ?useP <" + URI + "> } ." +
                " FILTER(?useP != <http://wiki.synbiohub.org/wiki/Terms/synbiohub#topLevel>) " +
                "# USES");

        return searchQuery.loadTemplate(sparqlArgs);
    }

    public String getRootCollectionsSPARQL() {
        SPARQLQuery searchQuery = new SPARQLQuery("src/main/java/com/synbiohub/sbh3/sparql/RootCollectionMetadata.sparql");
        return searchQuery.getQuery();
    }

    public String getSubCollectionsSPARQL(String collectionInfo) {
        SPARQLQuery searchQuery = new SPARQLQuery("src/main/java/com/synbiohub/sbh3/sparql/SubCollectionMetadata.sparql");
        String IRI = "<" + config.get("databasePrefix").asText() + collectionInfo + ">";

        HashMap<String, String> sparqlArgs = new HashMap<String, String>
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
        JsonNode rawTree = mapper.readTree(rawJSON);
        ArrayList<ObjectNode> listOfParts = new ArrayList<>();
        for(JsonNode node : rawTree.get("results").get("bindings")) {
            ObjectNode part = mapper.createObjectNode();
            // Check to see if each field exists; otherwise represent as null
            part.put("type", (node.has("type") ? node.get("type").get("value").asText() : ""));
            part.put("uri", (node.has("uri") ? node.get("uri").get("value").asText() : ""));
            part.put("name", (node.has("name") ? node.get("name").get("value").asText() : ""));
            part.put("description", (node.has("description") ? node.get("description").get("value").asText() : ""));
            part.put("displayId", (node.has("displayId") ? node.get("displayId").get("value").asText() : ""));
            part.put("version", (node.has("version") ? node.get("version").get("value").asText() : ""));
            listOfParts.add(part);
        }
        return listOfParts.toString();
    }

    public String collectionToOutput(String rawJSON) throws JsonProcessingException{
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
        JsonNode rawData = mapper.readTree(rawJSON);
        String value = "";

            for(JsonNode node : rawData.get("results").get("bindings")) {
                value = node.get("count").get("value").asText();
            }
        return value;
    }
}
