package com.synbiohub.sbh3.search;

import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@RestController
public class SearchController {
    /*
    @GetMapping(value = "/search/{keyword}")
    @ResponseBody
    public String getResults(@RequestParam(required = false) Map<String,String> allParams, @PathVariable("keyword") String keyword) {
        System.out.println(allParams.entrySet());
        return keyword;
    }
    */
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

    /*
    @RequestMapping("/rootCollections")
    @ResponseBody
    public String getRootCollections() {

    }
     */

}
