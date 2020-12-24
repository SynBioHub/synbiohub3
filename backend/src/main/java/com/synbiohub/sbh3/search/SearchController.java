package com.synbiohub.sbh3.search;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.servlet.HandlerMapping;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import org.springframework.web.servlet.view.RedirectView;

import javax.servlet.http.HttpServletRequest;
import java.io.UnsupportedEncodingException;
import java.util.Map;

@RestController
public class SearchController {

    // Singleton search object for business logic
    @Autowired
    private SearchService searchService;

    @Autowired
    JsonNode config;

    private String baseUri = ServletUriComponentsBuilder.fromCurrentContextPath().build().toUriString();

    /**
     * Search Metadata endpoint
     * @param allParams Key/value pairs of all parameters
     * @return Metadata for the object from the specified search query in JSON format
     */
    @GetMapping(value = "/search")
    @ResponseBody
    public String getResults(@RequestParam Map<String,String> allParams) throws UnsupportedEncodingException{
        String sparqlQuery = searchService.getMetadataQuery(allParams);
        return getSPARQL(sparqlQuery);
    }


    /**
     * Redirects from the old search API to a standardized URI
     * <p> Use {@link SearchController#getResults(Map)} instead.
     * @deprecated
     * @param request The incoming request
     * @return Redirect to search controller
     */
    @GetMapping("/search/**")
    public RedirectView redirectOldSearch(HttpServletRequest request) {

        String requestURL = request.getRequestURL().toString();

        String keyword = requestURL.split("/search/")[1];

        return new RedirectView(baseUri + "/search?" + keyword);
    }

    /**
     * Queries Virtuoso
     * @param query SPARQL Query
     * @return Results from Virtuoso
     */
    @RequestMapping(value = "/sparql", headers = "Accept=application/json")
    @ResponseBody
    public String getSPARQL(@RequestParam String query) throws UnsupportedEncodingException {
        RestTemplate restTemplate = new RestTemplate();
        // Passing in query with brackets - need to do this or Spring Boot will complain about chars in the query
        String url = config.get("triplestore").get("sparqlEndpoint") + "?default-graph-uri=&query={query}&format=json&";
        return restTemplate.getForObject(url, String.class, query);
    }
}
