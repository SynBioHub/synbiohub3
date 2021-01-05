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
     * Search Metadata endpoint
     * @param allParams Key/value pairs of all parameters
     * @return Metadata for the object from the specified search query in JSON format
     */
    @GetMapping(value = "/search")
    @ResponseBody
    public String getResults(@RequestParam Map<String,String> allParams) throws UnsupportedEncodingException, JsonProcessingException {
        String sparqlQuery = searchService.getMetadataQuerySPARQL(allParams);
        System.out.println(sparqlQuery);
        return searchService.rawJSONToOutput(getSPARQL(sparqlQuery));
    }


    /**
     * Redirects from the old search URI to a standardized URI
     * <p> Use {@link SearchController#getResults(Map)} instead.
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
     * Search Count endpoint
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
     * Gets the count of a type
     * @param request The incoming type to count
     * @return A count in plaintext
     */
    @GetMapping("/{type:.+}/count")
    public String getTypeCount(@PathVariable("type") String type, HttpServletRequest request) throws JsonProcessingException {

        String sparqlQuery = searchService.getTypeCountSPARQL(type);
        return searchService.JSONToCount(getSPARQL(sparqlQuery));
    }

    /**
     * Gets the uses of a part
     * @param
     * @return JSON containing all parts that use that part
     */
    @GetMapping("/{visibility:.+}/{collectionID:.+}/{displayID:.+}/{version:.+}/uses")
    public String getUses(@PathVariable("visibility") String visibility, @PathVariable("collectionID") String collectionID,
                          @PathVariable("displayID") String displayID, @PathVariable("version") String version,
                          HttpServletRequest request) throws JsonProcessingException {

        String collectionInfo = String.format("%s/%s/%s/%s", visibility, collectionID, displayID, version);


        String sparqlQuery = searchService.getUsesSPARQL(collectionInfo);
        return searchService.rawJSONToOutput(getSPARQL(sparqlQuery));
    }



    /**
     * Queries Virtuoso via SPARQL
     * @param query SPARQL Query
     * @return Results from Virtuoso
     */
    @RequestMapping(value = "/sparql", headers = "Accept=application/json")
    @ResponseBody
    public String getSPARQL(@RequestParam String query) {
        RestTemplate restTemplate = new RestTemplate();
        // Passing in query with brackets - need to do this or Spring Boot will complain about chars in the query
        String url = config.get("triplestore").get("sparqlEndpoint").asText() + "?default-graph-uri=&query={query}&format=json&";
        return restTemplate.getForObject(url, String.class, query);
    }
}
