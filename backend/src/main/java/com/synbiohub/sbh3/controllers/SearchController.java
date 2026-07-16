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
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@Tag(name = "Search & Discovery", description = "Endpoints for querying the SynBioHub registry via SPARQL, text search, and browsing collections.")
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
    @Operation(summary = "Search registry", description = "Returns metadata for objects matching the specified search query. Accepts flexible key/value filter parameters such as objectType, collection, creator, and free-text keywords. Supports pagination via offset and limit.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Search results returned as JSON array of metadata objects"),
            @ApiResponse(responseCode = "500", description = "SPARQL query or database error")
    })
    @GetMapping(value = "/search")
    @ResponseBody
    public String getResults(@Parameter(description = "Key/value pairs of search filters (e.g. objectType, collection, creator, offset, limit)") @RequestParam Map<String, String> allParams, HttpServletRequest request)
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
    @Deprecated
    @Operation(summary = "Search registry (legacy path)", description = "Redirects from old-style search URIs (e.g. /search/keyword) to the standardized /search endpoint. Extracts the trailing path segment as an additional search parameter.", deprecated = true)
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Search results returned as JSON array of metadata objects"),
            @ApiResponse(responseCode = "500", description = "SPARQL query or database error")
    })
    @GetMapping(value = "/search/**", produces = "text/plain")
    public String redirectOldSearch(HttpServletRequest request, @Parameter(description = "Key/value pairs of search filters") @RequestParam Map<String, String> allParams)
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
    @Operation(summary = "Get search result count", description = "Returns the total number of items matching the given search filters. Accepts the same parameters as /search.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Plaintext count of matching results"),
            @ApiResponse(responseCode = "500", description = "SPARQL query or database error")
    })
    @GetMapping(value = "/searchCount")
    @ResponseBody
    public String getSearchCount(@Parameter(description = "Key/value pairs of search filters (same as /search)") @RequestParam Map<String, String> allParams) throws IOException {
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
    @Deprecated
    @Operation(summary = "Get search result count (legacy path)", description = "Redirects from old-style search count URIs (e.g. /searchCount/keyword) to the standardized /searchCount endpoint.", deprecated = true)
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Plaintext count of matching results"),
            @ApiResponse(responseCode = "500", description = "SPARQL query or database error")
    })
    @GetMapping(value = "/searchCount/**", produces = "text/plain")
    public String redirectOldSearchCount(HttpServletRequest request, @Parameter(description = "Key/value pairs of search filters") @RequestParam Map<String, String> allParams)
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
    @Operation(summary = "Browse collections", description = "Returns all root collections as well as any Web of Registries collections. Used to populate the top-level browse page.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "JSON array of root and Web of Registries collections"),
            @ApiResponse(responseCode = "500", description = "SPARQL query or database error")
    })
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
    @Operation(summary = "Get root collections", description = "Returns all root-level collections in the registry (excludes Web of Registries collections).")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "JSON array of root collection metadata"),
            @ApiResponse(responseCode = "500", description = "SPARQL query or database error")
    })
    @GetMapping(value = "/rootCollections")
    public String getRootCollections() throws IOException {
        String sparqlQuery = searchService.getRootCollectionsSPARQL();
        log.info("Getting root collections");
        return searchService.collectionToOutput(searchService.SPARQLQuery(sparqlQuery));
    }

    /**
     * @return JSON array of submission metadata (same shape as search), each with {@code triplestore} public/private.
     */
    @Operation(summary = "Get user submissions", description = "Returns all submissions (public and private) owned by the authenticated user. Each result includes a 'triplestore' field indicating whether the submission is in the public or private graph.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "JSON array of submission metadata with triplestore visibility"),
            @ApiResponse(responseCode = "401", description = "User is not authenticated"),
            @ApiResponse(responseCode = "500", description = "SPARQL query or database error")
    })
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
    @Operation(summary = "Get shared objects", description = "Returns objects that other users have shared with the authenticated user via canView permissions (named graph + salted share URL suffix).")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "JSON array of shared object metadata"),
            @ApiResponse(responseCode = "401", description = "User is not authenticated"),
            @ApiResponse(responseCode = "500", description = "SPARQL query or database error")
    })
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
    @Operation(summary = "Get sub-collections", description = "Returns the collections that are members of the specified parent collection.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "JSON array of sub-collection metadata"),
            @ApiResponse(responseCode = "500", description = "SPARQL query or database error")
    })
    @GetMapping("/{visibility:.+}/{collectionID:.+}/{displayID:.+}/{version:.+}/**/subCollections")
    public String getSubCollections(
            @Parameter(description = "Visibility scope (e.g. 'public')") @PathVariable("visibility") String visibility,
            @Parameter(description = "Collection database ID") @PathVariable("collectionID") String collectionID,
            @Parameter(description = "Collection display ID") @PathVariable("displayID") String displayID,
            @Parameter(description = "Collection version") @PathVariable("version") String version,
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
    @Operation(summary = "Get twin components", description = "Returns other components that share the exact same sequence as the specified object.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "JSON array of twin component metadata"),
            @ApiResponse(responseCode = "500", description = "SPARQL query or database error")
    })
    @GetMapping("/{visibility:.+}/{collectionID:.+}/{displayID:.+}/{version:.+}/**/twins")
    public String getTwins(
            @Parameter(description = "Visibility scope (e.g. 'public')") @PathVariable("visibility") String visibility,
            @Parameter(description = "Collection database ID") @PathVariable("collectionID") String collectionID,
            @Parameter(description = "Component display ID") @PathVariable("displayID") String displayID,
            @Parameter(description = "Component version") @PathVariable("version") String version,
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
    @Operation(summary = "Get twin count", description = "Returns the count of other components that share the exact same sequence as the specified object.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Plaintext count of twin components"),
            @ApiResponse(responseCode = "500", description = "SPARQL query or database error")
    })
    @GetMapping("/{visibility:.+}/{collectionID:.+}/{displayID:.+}/{version:.+}/**/twinsCount")
    public String getTwinsCount(
            @Parameter(description = "Visibility scope (e.g. 'public')") @PathVariable("visibility") String visibility,
            @Parameter(description = "Collection database ID") @PathVariable("collectionID") String collectionID,
            @Parameter(description = "Component display ID") @PathVariable("displayID") String displayID,
            @Parameter(description = "Component version") @PathVariable("version") String version,
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
    @Operation(summary = "Get similar components", description = "Returns components with similar sequences to the specified object. Requires SBOLExplorer to be activated.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "JSON array of similar component metadata"),
            @ApiResponse(responseCode = "500", description = "SPARQL query or database error, or SBOLExplorer not enabled")
    })
    @GetMapping("/{visibility:.+}/{collectionID:.+}/{displayID:.+}/{version:.+}/**/similar")
    public String getSimilar(
            @Parameter(description = "Visibility scope (e.g. 'public')") @PathVariable("visibility") String visibility,
            @Parameter(description = "Collection database ID") @PathVariable("collectionID") String collectionID,
            @Parameter(description = "Component display ID") @PathVariable("displayID") String displayID,
            @Parameter(description = "Component version") @PathVariable("version") String version,
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
    @Operation(summary = "Get similar count", description = "Returns the count of components with similar sequences to the specified object. Requires SBOLExplorer to be activated.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Plaintext count of similar components"),
            @ApiResponse(responseCode = "500", description = "SPARQL query or database error, or SBOLExplorer not enabled")
    })
    @GetMapping("/{visibility:.+}/{collectionID:.+}/{displayID:.+}/{version:.+}/**/similarCount")
    public String getSimilarCount(
            @Parameter(description = "Visibility scope (e.g. 'public')") @PathVariable("visibility") String visibility,
            @Parameter(description = "Collection database ID") @PathVariable("collectionID") String collectionID,
            @Parameter(description = "Component display ID") @PathVariable("displayID") String displayID,
            @Parameter(description = "Component version") @PathVariable("version") String version,
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
    @Operation(summary = "Get uses", description = "Returns any other object that refers to this object. For example, if the object is a component, it returns all other components that use it as a sub-component.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "JSON array of referencing object metadata"),
            @ApiResponse(responseCode = "500", description = "SPARQL query or database error")
    })
    @GetMapping("/{visibility:.+}/{collectionID:.+}/{displayID:.+}/{version:.+}/**/uses")
    public String getUses(
            @Parameter(description = "Visibility scope (e.g. 'public')") @PathVariable("visibility") String visibility,
            @Parameter(description = "Collection database ID") @PathVariable("collectionID") String collectionID,
            @Parameter(description = "Component display ID") @PathVariable("displayID") String displayID,
            @Parameter(description = "Component version") @PathVariable("version") String version,
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
    @Operation(summary = "Get uses count", description = "Returns the count of objects that reference the specified object (e.g. components using it as a sub-component).")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Plaintext count of referencing objects"),
            @ApiResponse(responseCode = "500", description = "SPARQL query or database error")
    })
    @GetMapping("/{visibility:.+}/{collectionID:.+}/{displayID:.+}/{version:.+}/**/usesCount")
    public String getUsesCount(
            @Parameter(description = "Visibility scope (e.g. 'public')") @PathVariable("visibility") String visibility,
            @Parameter(description = "Collection database ID") @PathVariable("collectionID") String collectionID,
            @Parameter(description = "Component display ID") @PathVariable("displayID") String displayID,
            @Parameter(description = "Component version") @PathVariable("version") String version,
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
    @Operation(summary = "Get type count", description = "Returns the total number of objects of a specified SBOL type (e.g. ComponentDefinition, Sequence) in the registry.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Plaintext count of objects of the specified type"),
            @ApiResponse(responseCode = "500", description = "SPARQL query or database error")
    })
    @GetMapping("/{type:.+}/count")
    public String getTypeCount(@Parameter(description = "SBOL object type (e.g. ComponentDefinition, Sequence)") @PathVariable("type") String type, HttpServletRequest request) throws IOException {

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
    @Operation(summary = "Execute SPARQL query", description = "Executes a raw SPARQL query against the triplestore and returns results as JSON. Routes through SBOLExplorer if enabled, otherwise queries Virtuoso directly.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "SPARQL query results as JSON"),
            @ApiResponse(responseCode = "500", description = "SPARQL syntax error or database error")
    })
    @RequestMapping(value = "/sparql", headers = "Accept=application/json")
    @ResponseBody
    public String getSPARQL(@Parameter(description = "Query parameters: 'query' (SPARQL query string) and optional 'default-graph-uri'") @RequestParam Map<String, String> params) throws IOException {
        return searchService.SPARQLQuery(params.get("query"), params.get("default-graph-uri"));
    }

    // @GetMapping(value = "/search/**")
    // public String sequenceSearch() throws JsonProcessingException {
    // return "Done";
    // }
}
