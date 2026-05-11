package com.synbiohub.sbh3.controllers;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.synbiohub.sbh3.security.customsecurity.ServletPathUtil;
import com.synbiohub.sbh3.security.model.User;
import com.synbiohub.sbh3.security.repo.UserRepository;
import com.synbiohub.sbh3.services.SearchService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@Slf4j
public class SearchController {

    // Singleton search object for business logic
    private final SearchService searchService;

    private final UserRepository userRepository;

    /**
     * Returns the metadata for the object from the specified search query.
     * 
     * @param allParams Key/value pairs of all parameters
     * @return Metadata for the object from the specified search query in JSON
     *         format
     */
    @GetMapping(value = "/search")
    @ResponseBody
    public String getResults(@RequestParam Map<String, String> allParams, HttpServletRequest request)
            throws IOException {
        String sparqlQuery = searchService.getMetadataQuerySPARQL(allParams);
        return searchService.rawJSONToOutput(searchService.SPARQLOrExplorerQuery(sparqlQuery));
    }

    /**
     * Redirects from the old search URI to a standardized URI
     * <p>
     * Use {@link SearchController#getResults(Map, HttpServletRequest)} instead.
     * 
     * @deprecated
     * @param request The incoming request
     * @return Redirect to search controller
     */
    @GetMapping(value = "/search/**", produces = "text/plain")
    public String redirectOldSearch(HttpServletRequest request, @RequestParam Map<String, String> allParams)
            throws IOException {
        String requestURL = request.getRequestURL().toString();
        String[] uriArr = requestURL.split("/");
        String keyword = uriArr[uriArr.length - 1].split("\\?")[0];
        if (!(uriArr.length == 4 && (keyword.equals("search")))) {
            allParams.put(keyword, "");
        }
        String sparqlQuery = searchService.getMetadataQuerySPARQL(allParams);
        return searchService.rawJSONToOutput(searchService.SPARQLOrExplorerQuery(sparqlQuery));
    }

    /**
     * Returns the number of items matching the search result.
     * 
     * @param allParams Key/value pairs of all parameters
     * @return Count for the number of results
     */
    @GetMapping(value = "/searchCount")
    @ResponseBody
    public String getSearchCount(@RequestParam Map<String, String> allParams) throws IOException {
        String sparqlQuery = searchService.getSearchCountSPARQL(allParams);
        return searchService.JSONToCount(searchService.SPARQLOrExplorerQuery(sparqlQuery));
    }

    /**
     * Redirects from the old search count URI to a standardized URI
     * <p>
     * Use {@link SearchController#getSearchCount(Map)} instead.
     * 
     * @deprecated
     * @param request The incoming query to count
     * @return Redirect to search count controller
     */
    @GetMapping(value = "/searchCount/**", produces = "text/plain")
    public String redirectOldSearchCount(HttpServletRequest request, @RequestParam Map<String, String> allParams)
            throws IOException {
        String requestURL = request.getRequestURL().toString();
        String[] uriArr = requestURL.split("/");
        String keyword = uriArr[uriArr.length - 1].split("\\?")[0];
        if (!(uriArr.length == 4 && (keyword.equals("searchCount")))) {
            allParams.put(keyword, "");
        }
        String sparqlQuery = searchService.getSearchCountSPARQL(allParams);
        return searchService.JSONToCount(searchService.SPARQLOrExplorerQuery(sparqlQuery));
    }

    /**
     * Returns all root collections as well as web of registries collections.
     * 
     * @return All root collections as well as web of registries collections
     */
    @GetMapping(value = "/browse")
    public String getBrowse() throws IOException {
        log.info("Getting browse collections (root + web of registries)");
        return searchService.getBrowseCollectionsJSON();
    }

    /**
     * Returns all root collections.
     * 
     * @return All root collections
     */
    @GetMapping(value = "/rootCollections")
    public String getRootCollections() throws IOException {
        String sparqlQuery = searchService.getRootCollectionsSPARQL();
        log.info("Getting root collections");
        return searchService.collectionToOutput(searchService.SPARQLQuery(sparqlQuery));
    }

    /**
     * @return JSON array of submission metadata (same shape as search), each with {@code triplestore} public/private.
     */
    @GetMapping(value = "/manage", produces = MediaType.APPLICATION_JSON_VALUE)
    public JsonNode getSubmissions() throws IOException {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userRepository.findByUsername(auth.getName()).orElseThrow();

        String sparql = searchService.getManageSubmissionsSPARQL(user.getEmail(), user.getUsername());

        String publicResults = searchService.SPARQLQuery(sparql);
        String privateResults = searchService.SPARQLQuery(sparql, searchService.resolveUserNamedGraphUri(user));

        return searchService.mergeManageResults(publicResults, privateResults);
    }

    /**
     * Objects other users shared with this user via {@code sbh:canView} (named graph + salted share URL suffix).
     */
    @GetMapping(value = "/shared", produces = MediaType.APPLICATION_JSON_VALUE)
    public JsonNode getSharedObjects() throws IOException, JsonProcessingException {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userRepository.findByUsername(auth.getName()).orElseThrow();
        return searchService.getSharedObjectsJSON(user);
    }

    /**
     * Returns the collections that are members of another collection.
     * 
     * @param
     * @return JSON containing all sub collections
     */
    @GetMapping("/{visibility:.+}/{collectionID:.+}/{displayID:.+}/{version:.+}/**/subCollections")
    public String getSubCollections(@PathVariable("visibility") String visibility,
            @PathVariable("collectionID") String collectionID,
            @PathVariable("displayID") String displayID, @PathVariable("version") String version,
            HttpServletRequest request) throws IOException {

        String collectionInfo = collectionInfoFromRequestPath(request, "subCollections");
        String sparqlQuery = searchService.getSubCollectionsSPARQL(collectionInfo);
        return searchService.collectionToOutput(searchService.SPARQLQuery(sparqlQuery));
    }

    /**
     * Returns other components that have the same sequence.
     * 
     * @param
     * @return JSON containing all twins
     */
    @GetMapping("/{visibility:.+}/{collectionID:.+}/{displayID:.+}/{version:.+}/**/twins")
    public String getTwins(@PathVariable("visibility") String visibility,
            @PathVariable("collectionID") String collectionID,
            @PathVariable("displayID") String displayID, @PathVariable("version") String version,
            HttpServletRequest request) throws IOException {

        String collectionInfo = collectionInfoFromRequestPath(request, "twins");

        String sparqlQuery = searchService.getURISPARQL(collectionInfo, "twins");
        return searchService.rawJSONToOutput(searchService.SPARQLOrExplorerQuery(sparqlQuery));
    }

    /**
     * Returns count of other components that have the same sequence.
     * 
     * @param
     * @return Plaintext count of all twins
     */
    @GetMapping("/{visibility:.+}/{collectionID:.+}/{displayID:.+}/{version:.+}/**/twinsCount")
    public String getTwinsCount(@PathVariable("visibility") String visibility,
            @PathVariable("collectionID") String collectionID,
            @PathVariable("displayID") String displayID, @PathVariable("version") String version,
            HttpServletRequest request) throws IOException {

        String collectionInfo = collectionInfoFromRequestPath(request, "twinsCount");

        String sparqlQuery = searchService.getTwinsCountSPARQL(collectionInfo);
        return searchService.JSONToCount(searchService.SPARQLQuery(sparqlQuery));
    }

    /**
     * Returns other components that have similar sequences.
     * Note that this endpoint only works if SBOLExplorer is activated.
     * 
     * @param
     * @return JSON containing all components with similar sequences.
     */
    @GetMapping("/{visibility:.+}/{collectionID:.+}/{displayID:.+}/{version:.+}/**/similar")
    public String getSimilar(@PathVariable("visibility") String visibility,
            @PathVariable("collectionID") String collectionID,
            @PathVariable("displayID") String displayID, @PathVariable("version") String version,
            HttpServletRequest request) throws IOException {

        String collectionInfo = collectionInfoFromRequestPath(request, "similar");

        String sparqlQuery = searchService.getURISPARQL(collectionInfo, "similar");
        return searchService.rawJSONToOutput(searchService.SPARQLOrExplorerQuery(sparqlQuery));
    }

    /**
     * Returns other components that have similar sequences.
     * Note that this endpoint only works if SBOLExplorer is activated.
     * 
     * @param
     * @return JSON containing all components with similar sequences.
     */
    @GetMapping("/{visibility:.+}/{collectionID:.+}/{displayID:.+}/{version:.+}/**/similarCount")
    public String getSimilarCount(@PathVariable("visibility") String visibility,
            @PathVariable("collectionID") String collectionID,
            @PathVariable("displayID") String displayID, @PathVariable("version") String version,
            HttpServletRequest request) throws IOException {

        String collectionInfo = collectionInfoFromRequestPath(request, "similarCount");

        String sparqlQuery = searchService.getSimilarCountSPARQL(collectionInfo);
        return searchService.JSONToCount(searchService.SPARQLQuery(sparqlQuery));
    }

    /**
     * Returns any other object that refers to this object.
     * For example, if the object is a component, it will return all other
     * components that use this as a sub-component.
     * 
     * @param
     * @return JSON containing all parts that use that part
     */
    @GetMapping("/{visibility:.+}/{collectionID:.+}/{displayID:.+}/{version:.+}/**/uses")
    public String getUses(@PathVariable("visibility") String visibility,
            @PathVariable("collectionID") String collectionID,
            @PathVariable("displayID") String displayID, @PathVariable("version") String version,
            HttpServletRequest request) throws IOException {

        String collectionInfo = collectionInfoFromRequestPath(request, "uses");

        String sparqlQuery = searchService.getURISPARQL(collectionInfo, "uses");
        return searchService.rawJSONToOutput(searchService.SPARQLQuery(sparqlQuery));
    }

    /**
     * Returns any other object that refers to this object.
     * For example, if the object is a component, it will return all other
     * components that use this as a sub-component.
     * 
     * @param
     * @return Plaintext count of all parts that use that part
     */
    @GetMapping("/{visibility:.+}/{collectionID:.+}/{displayID:.+}/{version:.+}/**/usesCount")
    public String getUsesCount(@PathVariable("visibility") String visibility,
            @PathVariable("collectionID") String collectionID,
            @PathVariable("displayID") String displayID, @PathVariable("version") String version,
            HttpServletRequest request) throws IOException {

        String collectionInfo = collectionInfoFromRequestPath(request, "usesCount");

        String sparqlQuery = searchService.getUsesCountSPARQL(collectionInfo);
        return searchService.JSONToCount(searchService.SPARQLQuery(sparqlQuery));
    }

    /**
     * Builds collectionInfo for search endpoints from servlet path.
     * Public path shape: /public/{db}/{id}/{ver}/{suffix}
     * Private path shape: /user/{username}/{db}/{id}/{ver}/{suffix}
     */
    private static String collectionInfoFromRequestPath(HttpServletRequest request, String suffix) {
        String path = ServletPathUtil.getPathWithinApplication(request);
        String trailer = "/" + suffix;
        if (path.endsWith(trailer)) {
            path = path.substring(0, path.length() - trailer.length());
        }
        List<String> segments = pathSegments(path);
        if (segments.size() >= 5 && "user".equals(segments.get(0))) {
            return String.join("/",
                    segments.get(0), segments.get(1), segments.get(2), segments.get(3), segments.get(4));
        }
        if (segments.size() >= 4) {
            return String.join("/",
                    segments.get(0), segments.get(1), segments.get(2), segments.get(3));
        }
        throw new IllegalArgumentException("Invalid linked-search path: " + path);
    }

    private static List<String> pathSegments(String path) {
        List<String> out = new ArrayList<>();
        for (String s : path.split("/")) {
            if (!s.isEmpty()) {
                out.add(s);
            }
        }
        return out;
    }

    /**
     * Returns the number of objects with a specified object type.
     * 
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
     * Use SBOLExplorer if it is enabled in the config, else send query directly to
     * Virtuoso.
     * 
     * @param query SPARQL Query
     * @return JSON containing parts
     */
    @RequestMapping(value = "/sparql", headers = "Accept=application/json")
    @ResponseBody
    public String getSPARQL(@RequestParam Map<String, String> params) throws IOException {
        return searchService.SPARQLQuery(params.get("query"), params.get("default-graph-uri"));
    }

    // @GetMapping(value = "/search/**")
    // public String sequenceSearch() throws JsonProcessingException {
    // return "Done";
    // }
}
