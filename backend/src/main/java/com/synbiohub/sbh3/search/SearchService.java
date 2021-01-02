package com.synbiohub.sbh3.search;

 import com.fasterxml.jackson.core.JsonProcessingException;
 import com.fasterxml.jackson.databind.JsonNode;
 import com.fasterxml.jackson.databind.ObjectMapper;
 import com.fasterxml.jackson.databind.node.ObjectNode;
 import com.synbiohub.sbh3.sparql.SPARQLQuery;
 import org.springframework.beans.factory.annotation.Autowired;
 import org.springframework.stereotype.Service;

 import java.util.ArrayList;
 import java.util.HashMap;
 import java.util.Map;

/**
 * Handles the business logic (parsing keys, formatting SPARQL, etc)
 * @see SearchController
 */
@Service
public class SearchService {

    @Autowired
    JsonNode config;

    /**
     * Returns the metadata for the object from the specified search query
     * @param allParams Key/Value pairs of the query
     * @return String containing SPARQL query
     * @see SearchController#getResults(Map)
     */
    public String getMetadataQuery(Map<String,String> allParams) {
        SPARQLQuery searchQuery = new SPARQLQuery("src/main/java/com/synbiohub/sbh3/sparql/search.sparql");
        HashMap<String, String> sparqlArgs = new HashMap<String, String>
                (Map.of("from", "", "criteria", "", "limit", "", "offset", ""));
        String criteriaString = "";

        // Process search parameters
        for (Map.Entry<String, String> param : allParams.entrySet()) {
            // Set offset and limit of query
            if (param.getKey().equals("offset")) {
                sparqlArgs.replace("offset", "OFFSET " + param.getValue());
                continue;
            }

            else if (param.getKey().equals("limit")) {
                sparqlArgs.replace("limit", "LIMIT " + param.getValue());
                continue;
            }

            // A tag in the dcterms namespace to search for
            if (param.getKey().contains(":")) {
                criteriaString += "   ?subject " + param.getKey() + " " + param.getValue() + " . ";
            }
            // Type of object to search for
            else if (param.getKey().equals("objectType")) {
                if (param.getValue().contains(":")) {
                    criteriaString += "   ?subject a " +param.getValue() + " . ";
                } else {
                    criteriaString += "   ?subject a sbol2:" + param.getValue() + " . ";
                }
            }

            else if (param.getKey().equals("collection")) {
                criteriaString += "   ?collection a sbol2:Collection .   " + param.getValue() + " sbol2:member ?subject .";
            }

            else if (param.getKey().equals("createdBefore")) {
                criteriaString += "   FILTER (xsd:dateTime(?cdate) <= \"" + param.getValue() + "T23:59:59Z\"^^xsd:dateTime) ";
            }

            else if (param.getKey().equals("createdAfter")) {
                criteriaString += "   FILTER (xsd:dateTime(?cdate) >= \"" + param.getValue() + "T00:00:00Z\"^^xsd:dateTime) ";
            }

            else if (param.getKey().equals("modifiedBefore")) {
                criteriaString += "   FILTER (xsd:dateTime(?mdate) <= \"" + param.getValue() + "T23:59:59Z\"^^xsd:dateTime) ";
            }

            else if (param.getKey().equals("modifiedAfter")) {
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
                    criteriaString += String.format(criteria, searchTerms[i], searchTerms[i], searchTerms[i]).replace("/''/g", "'\\\''");;
                }
                criteriaString += ')';
            }

            else {
                criteriaString += "   ?subject sbol2:" + param.getKey() + " " + param.getValue() + " . ";
            }
        }

        sparqlArgs.replace("criteria", criteriaString);
        return searchQuery.loadTemplate(sparqlArgs);
    }

    public String rawJSONToOutput(String rawJSON) throws JsonProcessingException {
        ObjectMapper mapper = new ObjectMapper();
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

}
