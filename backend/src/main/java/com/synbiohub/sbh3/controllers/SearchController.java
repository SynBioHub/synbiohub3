package com.synbiohub.sbh3.controllers;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.synbiohub.sbh3.services.SearchService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@Slf4j
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
    public String getResults(@RequestParam Map<String,String> allParams, HttpServletRequest request) throws IOException {
        String sparqlQuery = searchService.getMetadataQuerySPARQL(allParams);
        return searchService.rawJSONToOutput(searchService.SPARQLOrExplorerQuery(sparqlQuery));
    }


    /**
     * Redirects from the old search URI to a standardized URI
     * <p> Use {@link SearchController#getResults(Map, HttpServletRequest)} instead.
     * @deprecated
     * @param request The incoming request
     * @return Redirect to search controller
     */
    @GetMapping(value = "/search/**", produces = "text/plain")
    public String redirectOldSearch(HttpServletRequest request, @RequestParam Map<String,String> allParams) throws IOException {
        String requestURL = request.getRequestURL().toString();
        String[] uriArr = requestURL.split("/");
        String keyword = uriArr[uriArr.length - 1].split("\\?")[0];
        allParams.put(keyword, "");
        String sparqlQuery = searchService.getMetadataQuerySPARQL(allParams);
        return searchService.rawJSONToOutput(searchService.SPARQLOrExplorerQuery(sparqlQuery));
    }
    
    /**
     * Returns the number of items matching the search result.
     * @param allParams Key/value pairs of all parameters
     * @return Count for the number of results
     */
    @GetMapping(value = "/searchCount")
    @ResponseBody
    public String getSearchCount(@RequestParam Map<String,String> allParams) throws IOException {
        String sparqlQuery = searchService.getSearchCountSPARQL(allParams);
        return searchService.JSONToCount(searchService.SPARQLOrExplorerQuery(sparqlQuery));
    }


    /**
     * Redirects from the old search count URI to a standardized URI
     * <p> Use {@link SearchController#getSearchCount(Map)} instead.
     * @deprecated
     * @param request The incoming query to count
     * @return Redirect to search count controller
     */
    @GetMapping(value = "/searchCount/**", produces = "text/plain")
    public String redirectOldSearchCount(HttpServletRequest request, @RequestParam Map<String,String> allParams) throws IOException {
        String requestURL = request.getRequestURL().toString();
        String[] uriArr = requestURL.split("/");
        String keyword = uriArr[uriArr.length - 1].split("\\?")[0];
        allParams.put(keyword, "");
        String sparqlQuery = searchService.getSearchCountSPARQL(allParams);
        return searchService.JSONToCount(searchService.SPARQLOrExplorerQuery(sparqlQuery));
    }

    /**
     * Returns all root collections.
     * @return All root collections
     */
    @GetMapping(value = "/rootCollections")
    public String getRootCollections() throws IOException {
        String sparqlQuery = searchService.getRootCollectionsSPARQL();
        log.info("Getting root collections");
        return searchService.collectionToOutput(searchService.SPARQLQuery(sparqlQuery));
    }

    /**
     * Returns the meta data on all submissions for the user specified by the X-authorization token.
     * @return JSON metadata
     */
    @GetMapping(value = "/manage")
    public JSONObject getSubmissions() throws JsonProcessingException {
        return null;
    }

    /**
     * Returns the meta data on objects that other users have shared with the user specified by the X-authorization token.
     * @return JSON metadata
     */
    @GetMapping(value = "/shared")
    public JSONObject getSharedObjects() throws JsonProcessingException {
        return null;
    }

    /**
     * Returns the collections that are members of another collection.
     * @param
     * @return JSON containing all sub collections
     */
    @GetMapping("/{visibility:.+}/{collectionID:.+}/{displayID:.+}/{version:.+}/subCollections")
    public String getSubCollections(@PathVariable("visibility") String visibility, @PathVariable("collectionID") String collectionID,
                           @PathVariable("displayID") String displayID, @PathVariable("version") String version,
                           HttpServletRequest request) throws IOException {

        String collectionInfo = String.format("%s/%s/%s/%s", visibility, collectionID, displayID, version);
        String sparqlQuery = searchService.getSubCollectionsSPARQL(collectionInfo);
        return searchService.collectionToOutput(searchService.SPARQLQuery(sparqlQuery));
    }

    /**
     * Returns other components that have the same sequence.
     * @param
     * @return JSON containing all twins
     */
    @GetMapping("/{visibility:.+}/{collectionID:.+}/{displayID:.+}/{version:.+}/twins")
    public String getTwins(@PathVariable("visibility") String visibility, @PathVariable("collectionID") String collectionID,
                           @PathVariable("displayID") String displayID, @PathVariable("version") String version,
                           HttpServletRequest request) throws IOException {

        String collectionInfo = String.format("%s/%s/%s/%s", visibility, collectionID, displayID, version);


        String sparqlQuery = searchService.getURISPARQL(collectionInfo, "twins");
        return searchService.rawJSONToOutput(searchService.SPARQLOrExplorerQuery(sparqlQuery));
    }

    /**
     * Returns other components that have similar sequences.
     * Note that this endpoint only works if SBOLExplorer is activated.
     * @param
     * @return JSON containing all components with similar sequences.
     */
    @GetMapping("/{visibility:.+}/{collectionID:.+}/{displayID:.+}/{version:.+}/similar")
    public String getSimilar(@PathVariable("visibility") String visibility, @PathVariable("collectionID") String collectionID,
                           @PathVariable("displayID") String displayID, @PathVariable("version") String version,
                           HttpServletRequest request) throws IOException {

        String collectionInfo = String.format("%s/%s/%s/%s", visibility, collectionID, displayID, version);


        String sparqlQuery = searchService.getURISPARQL(collectionInfo, "similar");
        return searchService.rawJSONToOutput(searchService.SPARQLOrExplorerQuery(sparqlQuery));
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
                          HttpServletRequest request) throws IOException {

        String collectionInfo = String.format("%s/%s/%s/%s", visibility, collectionID, displayID, version);


        String sparqlQuery = searchService.getURISPARQL(collectionInfo, "uses");
        return searchService.rawJSONToOutput(searchService.SPARQLQuery(sparqlQuery));
    }

    /**
     * Returns the number of objects with a specified object type.
     * @param request The incoming type to count
     * @return A count in plaintext
     */
    @GetMapping("/{type:.+}/count")
    public String getTypeCount(@PathVariable("type") String type, HttpServletRequest request) throws IOException {

        String sparqlQuery = searchService.getTypeCountSPARQL(type);
        return searchService.JSONToCount(searchService.SPARQLQuery(sparqlQuery));
    }

    /**
     * Returns the results of the SPARQL query in JSON format.
     * Use SBOLExplorer if it is enabled in the config, else send query directly to Virtuoso.
     * @param query SPARQL Query
     * @return JSON containing parts
     */
    @RequestMapping(value = "/sparql", headers = "Accept=application/json")
    @ResponseBody
    public String getSPARQL(@RequestParam Map<String, String> params) throws IOException {
        System.out.println(params);
        return searchService.SPARQLQuery(params.get("query"));
    }

//    @GetMapping(value = "/search/**")
//    public String sequenceSearch() throws JsonProcessingException {
//        return "Done";
//    }
}
