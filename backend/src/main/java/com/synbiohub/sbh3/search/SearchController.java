package com.synbiohub.sbh3.search;

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

    /**
     * Search Metadata endpoint
     * @param allParams Key/value pairs of all parameters
     * @return Metadata for the object from the specified search query in JSON format
     */
    @GetMapping(value = "/search")
    @ResponseBody
    public String getResults(@RequestParam Map<String,String> allParams) {
        return searchService.getMetadataQuery(allParams);
    }


    /**
     * Redirects from the old search API to a standardized URI
     * <p> Use {@link SearchController#getResults(Map)} instead.
     * @deprecated
     * @param keyword
     * @return Redirect to search controller
     */
    @GetMapping("/search/{keyword}")
    public RedirectView redirectOldSearch(@PathVariable("keyword") String keyword) {
        String baseUri = ServletUriComponentsBuilder.fromCurrentContextPath().build().toUriString();
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
        String url = "http://localhost:8890/sparql?default-graph-uri=&query={query}&format=json&";
        return restTemplate.getForObject(url, String.class, query);
    }
}
