package com.synbiohub.sbh3.controllers;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.synbiohub.sbh3.services.SearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpMethod;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import org.springframework.web.servlet.view.RedirectView;

import javax.servlet.http.HttpServletRequest;
import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class SearchController {

    // Singleton search object for business logic
    private final SearchService searchService;



    /**
     * Returns the metadata for the object from the specified search query.
     * @param allParams Key/value pairs of all parameters
     * @return Metadata for the object from the specified search query in JSON format
     */
    @GetMapping(value = "/search")
    @ResponseBody
    public String getResults(@RequestParam Map<String,String> allParams, HttpServletRequest request) throws JsonProcessingException {
        String sparqlQuery = searchService.getMetadataQuerySPARQL(allParams);
        return searchService.rawJSONToOutput(searchService.SPARQLQuery(sparqlQuery));
    }


    /**
     * Redirects from the old search URI to a standardized URI
     * <p> Use {@link SearchController#getResults(Map, HttpServletRequest)} instead.
     * @deprecated
     * @param request The incoming request
     * @return Redirect to search controller
     */
    @GetMapping(value = "/search/**", produces = "text/plain")
    public String redirectOldSearch(HttpServletRequest request) {

        String requestURL = request.getRequestURL().toString();

        String limitAndOffset = request.getQueryString();

        if (limitAndOffset != null)
            requestURL = requestURL + "&" + limitAndOffset;

        String keyword = requestURL.split("/search/")[1];

        String baseUri = ServletUriComponentsBuilder.fromCurrentContextPath().build().toUriString();

        String finalUri = URLDecoder.decode(baseUri + "/search?" + keyword);
        System.out.println("String search for: " + keyword);
        RestTemplate restTemplate = new RestTemplate();
        return restTemplate.exchange(finalUri, HttpMethod.GET, null, String.class).getBody();

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
        return searchService.JSONToCount(searchService.SPARQLQuery(sparqlQuery));
    }


    /**
     * Redirects from the old search count URI to a standardized URI
     * <p> Use {@link SearchController#getSearchCount(Map)} instead.
     * @deprecated
     * @param request The incoming query to count
     * @return Redirect to search count controller
     */
    @GetMapping(value = "/searchCount/**", produces = "text/plain")
    public String redirectOldSearchCount(HttpServletRequest request) {

        String requestURL = request.getRequestURL().toString();
        String keyword = requestURL.split("/searchCount/")[1];
        String baseUri = ServletUriComponentsBuilder.fromCurrentContextPath().build().toUriString();
        String finalUri = URLDecoder.decode(baseUri + "/searchCount?" + keyword);

        RestTemplate restTemplate = new RestTemplate();
        return restTemplate.exchange(finalUri, HttpMethod.GET, null, String.class).getBody();
    }

    /**
     * Returns all root collections.
     * @return All root collections
     */
    @GetMapping(value = "/rootCollections")
    public String getRootCollections() throws JsonProcessingException{

        String sparqlQuery = searchService.getRootCollectionsSPARQL();
        System.out.println("Getting root collections");
        return searchService.collectionToOutput(searchService.SPARQLQuery(sparqlQuery));
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
        return searchService.collectionToOutput(searchService.SPARQLQuery(sparqlQuery));
    }

    /**
     * Returns the number of objects with a specified object type.
     * @param request The incoming type to count
     * @return A count in plaintext
     */
    @GetMapping("/{type:.+}/count")
    public String getTypeCount(@PathVariable("type") String type, HttpServletRequest request) throws JsonProcessingException {

        String sparqlQuery = searchService.getTypeCountSPARQL(type);
        return searchService.JSONToCount(searchService.SPARQLQuery(sparqlQuery));
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
        return searchService.rawJSONToOutput(searchService.SPARQLQuery(sparqlQuery));
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
        return searchService.rawJSONToOutput(searchService.SPARQLQuery(sparqlQuery));
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
        return searchService.SPARQLQuery(query);

    }
}
