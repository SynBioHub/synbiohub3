package com.synbiohub.sbh3.search;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import org.springframework.web.servlet.view.RedirectView;

import javax.servlet.http.HttpServletRequest;
import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@RestController
public class SearchController {

    // Singleton search object for business logic
    @Autowired
    private SearchService searchService;

    // Singleton config file object
    @Autowired
    JsonNode config;

    /**
     * Returns the metadata for the object from the specified search query.
     * @param allParams Key/value pairs of all parameters
     * @return Metadata for the object from the specified search query in JSON format
     */
    @GetMapping(value = "/search")
    @ResponseBody
    public String getResults(@RequestParam Map<String,String> allParams, HttpServletRequest request) throws UnsupportedEncodingException, JsonProcessingException {
        String stuff = request.getQueryString();
        String sparqlQuery = searchService.getMetadataQuerySPARQL(allParams);
        System.out.println(sparqlQuery);
        return searchService.rawJSONToOutput(getSPARQL(sparqlQuery));
    }


    /**
     * Redirects from the old search URI to a standardized URI
     * <p> Use {@link SearchController#getResults(Map, HttpServletRequest)} instead.
     * @deprecated
     * @param request The incoming request
     * @return Redirect to search controller
     */
    @GetMapping("/search/**")
    public RedirectView redirectOldSearch(HttpServletRequest request) {

        String requestURL = request.getRequestURL().toString();

        String limitAndOffset = request.getQueryString();

        if (limitAndOffset != null)
            requestURL = requestURL.substring(0, requestURL.length() - 1) + "&" + limitAndOffset;

        String keyword = requestURL.split("/search/")[1];

        String baseUri = ServletUriComponentsBuilder.fromCurrentContextPath().build().toUriString();

        String finalUri = URLDecoder.decode(baseUri + "/search?" + keyword);

        return new RedirectView(finalUri);
    }
    
    /**
     * Returns the number of items matching the search result.
     * @param allParams Key/value pairs of all parameters
     * @return Count for the number of results
     */
    @GetMapping(value = "/searchCount")
    @ResponseBody
    public String getSearchCount(@RequestParam Map<String,String> allParams) throws UnsupportedEncodingException, JsonProcessingException {
        String sparqlQuery = searchService.getSearchCountSPARQL(allParams);
        System.out.println(sparqlQuery);
        return searchService.JSONToCount(getSPARQL(sparqlQuery));
    }


    /**
     * Redirects from the old search count URI to a standardized URI
     * <p> Use {@link SearchController#getSearchCount(Map)} instead.
     * @deprecated
     * @param request The incoming query to count
     * @return Redirect to search count controller
     */
    @GetMapping("/searchCount/**")
    public RedirectView redirectOldSearchCount(HttpServletRequest request) {

        String requestURL = request.getRequestURL().toString();

        String keyword = requestURL.split("/searchCount/")[1];

        String baseUri = ServletUriComponentsBuilder.fromCurrentContextPath().build().toUriString();

        String finalUri = URLDecoder.decode(baseUri + "/searchCount?" + keyword);

        return new RedirectView(finalUri);
    }

    /**
     * Returns all root collections.
     * @return All root collections
     */
    @GetMapping("/rootCollections")
    public String getRootCollections() throws JsonProcessingException{

        String sparqlQuery = searchService.getRootCollectionsSPARQL();
        return searchService.collectionToOutput(getSPARQL(sparqlQuery));
    }


    /**
     * Returns the collections that are members of another collection.
     * @param
     * @return JSON containing all sub collections
     */
    @GetMapping("/{visibility:.+}/{collectionID:.+}/{displayID:.+}/{version:.+}/subCollections")
    public String getSubCollections(@PathVariable("visibility") String visibility, @PathVariable("collectionID") String collectionID,
                           @PathVariable("displayID") String displayID, @PathVariable("version") String version,
                           HttpServletRequest request) throws JsonProcessingException {

        String collectionInfo = String.format("%s/%s/%s/%s", visibility, collectionID, displayID, version);


        String sparqlQuery = searchService.getSubCollectionsSPARQL(collectionInfo);
        return searchService.collectionToOutput(getSPARQL(sparqlQuery));
    }

    /**
     * Returns the number of objects with a specified object type.
     * @param request The incoming type to count
     * @return A count in plaintext
     */
    @GetMapping("/{type:.+}/count")
    public String getTypeCount(@PathVariable("type") String type, HttpServletRequest request) throws JsonProcessingException {

        String sparqlQuery = searchService.getTypeCountSPARQL(type);
        return searchService.JSONToCount(getSPARQL(sparqlQuery));
    }

    /**
     * Returns other components that have the same sequence.
     * @param
     * @return JSON containing all twins
     */
    @GetMapping("/{visibility:.+}/{collectionID:.+}/{displayID:.+}/{version:.+}/twins")
    public String getTwins(@PathVariable("visibility") String visibility, @PathVariable("collectionID") String collectionID,
                          @PathVariable("displayID") String displayID, @PathVariable("version") String version,
                          HttpServletRequest request) throws JsonProcessingException {

        String collectionInfo = String.format("%s/%s/%s/%s", visibility, collectionID, displayID, version);


        String sparqlQuery = searchService.getURISPARQL(collectionInfo, "twins");
        return searchService.rawJSONToOutput(getSPARQL(sparqlQuery));
    }

    /**
     * Returns any other object that refers to this object.
     * For example, if the object is a component, it will return all other components that use this as a sub-component.
     * @param
     * @return JSON containing all parts that use that part
     */
    @GetMapping("/{visibility:.+}/{collectionID:.+}/{displayID:.+}/{version:.+}/uses")
    public String getUses(@PathVariable("visibility") String visibility, @PathVariable("collectionID") String collectionID,
                          @PathVariable("displayID") String displayID, @PathVariable("version") String version,
                          HttpServletRequest request) throws JsonProcessingException {

        String collectionInfo = String.format("%s/%s/%s/%s", visibility, collectionID, displayID, version);


        String sparqlQuery = searchService.getURISPARQL(collectionInfo, "uses");
        return searchService.rawJSONToOutput(getSPARQL(sparqlQuery));
    }



    /**
     * Returns the results of the SPARQL query in JSON format.
     * Use SBOLExplorer if it is enabled in the config, else send query directly to Virtuoso.
     * @param query SPARQL Query
     * @return JSON containing parts
     */
    @RequestMapping(value = "/sparql", headers = "Accept=application/json")
    @ResponseBody
    public String getSPARQL(@RequestParam String query)  {
        RestTemplate restTemplate = new RestTemplate();
        String url = "";
        String defaultGraph = "";
        // Encoding the SPARQL query to be sent to Explorer/SPARQL
        HashMap<String, String> params = new HashMap<>();
        params.put("default-graph-uri", defaultGraph);
        params.put("query", query);

        if (config.get("useSBOLExplorer").asBoolean() && query.length() > 0)
            url = config.get("SBOLExplorerEndpoint").asText()  + "?default-graph-uri={defaultGraph}&query={query}&";
        else
            url = config.get("triplestore").get("sparqlEndpoint").asText() + "/?default-graph-uri={defaultGraph}&query={query}&format=json&" ;

        return restTemplate.getForObject(url, String.class, defaultGraph, query);
    }
}
