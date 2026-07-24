package com.synbiohub.sbh3.services;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.synbiohub.sbh3.controllers.SearchController;
import com.synbiohub.sbh3.dao.SparqlService;
import com.synbiohub.sbh3.security.model.User;
import com.synbiohub.sbh3.utils.ConfigUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.*;

/**
 * Handles the business logic (parsing keys, formatting SPARQL, etc)
 * @see SearchController
 */
@Service
@RequiredArgsConstructor
public class SearchService {

    private final SparqlService sparqlService;

    public String search(Map<String, String> params) throws IOException {
        String query = sparqlService.getMetadataQuerySPARQL(params);
        String results = sparqlService.read(sparqlService.sparqlQueryUrl(), sparqlService.resolveGraphUri(""), query);
        return rawJSONToOutput(results);
    }

    public String searchCount(Map<String, String> params) throws IOException {
        String query = sparqlService.getSearchCountSPARQL(params);
        String results = sparqlService.read(sparqlService.getExplorerUrl(), sparqlService.resolveGraphUri(""), query);
        return JSONToCount(results);
    }

    public Map<String, String> searchKeyword(HttpServletRequest request, Map<String, String> params, String key) {
        String requestURL = request.getRequestURL().toString();
        String[] uriArr = requestURL.split("/");
        String keyword = uriArr[uriArr.length - 1].split("\\?")[0];
        if (!(uriArr.length == 4 && (keyword.equals(key)))) {
            params.put("keyword", keyword);
        }
        return params;
    }

    private static String similarCriteria(String uri) {
        // TODO: turn on when SBOLExplorer is working
        return null;
    }

    // TODO: Make sure this method (and others) are compatible with user authentication in the future

//    public String getTwinsSPARQL(String collectionInfo) throws IOException {
//        SPARQLQuery searchQuery = new SPARQLQuery("src/main/java/com/synbiohub/sbh3/sparql/search.sparql");
//        HashMap<String, String> sparqlArgs = new HashMap<>
//                (Map.of("from", getPrivateGraph(), "criteria", "", "limit", "", "offset", ""));
//
//        String URI = ConfigUtil.get("databasePrefix").asText() + collectionInfo;
//
//        sparqlArgs.replace("criteria", " { ?subject ?p <" + URI + "> } UNION { ?subject ?p ?use . ?use ?useP <" + URI + "> } ." +
//                " FILTER(?useP != <http://wiki.synbiohub.org/wiki/Terms/synbiohub#topLevel>) " +
//                "# USES");
//
//        String userGraph = getPrivateGraph();
//        if (!userGraph.isEmpty()) {
//            sparqlArgs.replace("from", "FROM <" + userGraph + ">");
//        }
//
//        return searchQuery.loadTemplate(sparqlArgs);
//    }

    /**
     * Converts JSON from a SPARQL query to the API-specified JSON format
     * @param rawJSON JSON from a SPARQL query
     * @return JSON as specified by the API
     * @throws JsonProcessingException
     */
    public String rawJSONToOutput(String rawJSON) throws JsonProcessingException {
        var mapper = new ObjectMapper();
        JsonNode rawTree = mapper.readTree(rawJSON);
        ArrayList<ObjectNode> listOfParts = new ArrayList<>();
        for(JsonNode node : rawTree.get("results").get("bindings")) {
            listOfParts.add(bindingToObjectNode(mapper, node));
        }
        return listOfParts.toString();
    }

    /**
     * One SPARQL JSON binding row → same object shape as {@link #rawJSONToOutput} (uri, displayId, defaults, etc.).
     */
    private ObjectNode bindingToObjectNode(ObjectMapper mapper, JsonNode node) {
        Set<String> keySet = new HashSet<>();
        node.fieldNames().forEachRemaining(keySet::add);

        ObjectNode part = sparqlBindingRowToObjectNodePreserveKeys(mapper, node);

        JsonNode uriVal = part.remove("subject");
        if (uriVal != null) {
            part.set("uri", uriVal);
        }
        if (!keySet.contains("name")) {
            part.set("name", part.get("displayId"));
        }
        if (!keySet.contains("description")) {
            part.put("description", "");
        }
        return part;
    }

    /** One binding row {@code {"var":{"value":"…"}} …} → object with same keys holding literal nodes. */
    private static ObjectNode sparqlBindingRowToObjectNodePreserveKeys(ObjectMapper mapper, JsonNode binding) {
        ObjectNode row = mapper.createObjectNode();
        binding.fields().forEachRemaining(entry -> {
            JsonNode cell = entry.getValue();
            if (cell.hasNonNull("value")) {
                row.set(entry.getKey(), cell.get("value"));
            }
        });
        return row;
    }

    private static JsonNode sparqlBindingsArray(ObjectMapper mapper, String rawSparqlJson) throws JsonProcessingException {
        return mapper.readTree(rawSparqlJson).path("results").path("bindings");
    }

    /**
     * Root collections from the default graph plus synthetic entries from {@code webOfRegistries} (uri prefix → instance URL).
     */
    public String getBrowseCollectionsJSON() throws IOException {
        ObjectMapper mapper = new ObjectMapper();
        String raw = sparqlService.read(sparqlService.sparqlQueryUrl(), sparqlService.resolveGraphUri(""), sparqlService.getRootCollectionsSPARQL());
        ArrayNode list = collectionBindingsToArrayNode(mapper, raw);
        enrichLocalBrowseEntries(list);
        appendWebOfRegistries(mapper, list);
        return mapper.writeValueAsString(list);
    }

    /**
     * Adds {@code url} (path after configured instance base) and {@code public} for local root collections only.
     */
    private void enrichLocalBrowseEntries(ArrayNode collections) throws IOException {
        for (JsonNode n : collections) {
            if (!n.isObject()) {
                continue;
            }
            ObjectNode row = (ObjectNode) n;
            String uri = row.path("uri").asText("");
            row.put("url", relativePathAfterInstanceBase(uri));
            row.put("public", isPublicCollectionUri(uri));
        }
    }

    private String relativePathAfterInstanceBase(String uri) throws IOException {
        if (uri == null || uri.isEmpty()) {
            return "/";
        }
        String db = withTrailingSlash(ConfigUtil.get("databasePrefix").asText().trim());
        if (!db.isEmpty() && uri.startsWith(db)) {
            return withLeadingSlash(uri.substring(db.length()));
        }
        String inst = withTrailingSlash(instanceUriPrefixForGraphs().trim());
        if (!inst.isEmpty() && uri.startsWith(inst)) {
            return withLeadingSlash(uri.substring(inst.length()));
        }
        try {
            String path = URI.create(uri).getPath();
            if (path != null && !path.isEmpty()) {
                return path.startsWith("/") ? path : "/" + path;
            }
        } catch (Exception ignored) {
        }
        return "/";
    }

    private static String withLeadingSlash(String relative) {
        if (relative == null || relative.isEmpty()) {
            return "/";
        }
        return relative.startsWith("/") ? relative : "/" + relative;
    }

    private static String withTrailingSlash(String base) {
        if (base.isEmpty()) {
            return base;
        }
        return base.endsWith("/") ? base : base + "/";
    }

    private static boolean isPublicCollectionUri(String uri) {
        if (uri == null || uri.isEmpty()) {
            return false;
        }
        if (uri.contains("/public/")) {
            return true;
        }
        if (uri.contains("/user/")) {
            return false;
        }
        return false;
    }

    private static ArrayNode collectionBindingsToArrayNode(ObjectMapper mapper, String rawJSON) throws JsonProcessingException {
        JsonNode rawTree = mapper.readTree(rawJSON);
        ArrayNode listOfParts = mapper.createArrayNode();
        for (JsonNode node : rawTree.get("results").get("bindings")) {
            ObjectNode part = mapper.createObjectNode();
            part.put("uri", node.has("Collection") ? node.get("Collection").get("value").asText() : "");
            part.put("name", node.has("name") ? node.get("name").get("value").asText() : "");
            part.put("description", node.has("description") ? node.get("description").get("value").asText() : "");
            part.put("displayId", node.has("displayId") ? node.get("displayId").get("value").asText() : "");
            part.put("version", node.has("version") ? node.get("version").get("value").asText() : "");
            listOfParts.add(part);
        }
        return listOfParts;
    }

    private void appendWebOfRegistries(ObjectMapper mapper, ArrayNode collections) throws IOException {
        JsonNode wor = ConfigUtil.get("webOfRegistries");
        if (wor == null || !wor.isObject() || wor.isEmpty()) {
            return;
        }
        Set<String> existingUris = new HashSet<>();
        for (JsonNode n : collections) {
            if (n.has("uri") && !n.get("uri").isNull()) {
                existingUris.add(n.get("uri").asText());
            }
        }
        wor.fields().forEachRemaining(entry -> {
            String uriPrefix = entry.getKey();
            if (existingUris.contains(uriPrefix)) {
                return;
            }
            String instanceUrl = entry.getValue().asText("");
            String name = displayNameForRegistry(uriPrefix, instanceUrl);
            ObjectNode row = mapper.createObjectNode();
            row.put("uri", uriPrefix);
            row.put("name", name);
            row.put("description", "");
            row.put("displayId", name);
            row.put("version", "");
            row.put("url", instanceUrl);
            row.put("public", true);
            row.put("remote", true);
            collections.add(row);
        });
    }

    private static String displayNameForRegistry(String uriPrefix, String instanceUrl) {
        try {
            String trimmed = uriPrefix.replaceAll("/+$", "");
            URI parsed = URI.create(trimmed);
            String path = parsed.getPath();
            if (path != null && path.length() > 1) {
                String[] segs = path.split("/");
                String last = segs[segs.length - 1];
                if (!last.isEmpty()) {
                    return last;
                }
            }
            if (parsed.getHost() != null) {
                return parsed.getHost();
            }
            if (instanceUrl != null && !instanceUrl.isEmpty()) {
                URI iu = URI.create(instanceUrl.replaceAll("/+$", ""));
                if (iu.getHost() != null) {
                    return iu.getHost();
                }
            }
        } catch (Exception ignored) {
        }
        return uriPrefix;
    }

    public String collectionToOutput(String rawJSON) throws JsonProcessingException {
        ObjectMapper mapper = new ObjectMapper();
        return mapper.writeValueAsString(collectionBindingsToArrayNode(mapper, rawJSON));
    }

    /**
     * Converts JSON from a SPARQL query to a single string containing the count of a part/type
     * @param rawJSON JSON from a SPARQL query
     * @return A single number specifying the count
     * @throws JsonProcessingException
     */
    public String JSONToCount(String rawJSON) throws JsonProcessingException {
        var mapper = new ObjectMapper();
        JsonNode rawData = mapper.readTree(rawJSON);
        String value = "";

            for(JsonNode node : rawData.get("results").get("bindings")) {
                value = node.get("count").get("value").asText();
            }
        return value;
    }

    /**
     * CONSTRUCT against the configured public {@code defaultGraph} only.
     *
     * @see #SPARQLRDFXMLQuery(String, String)
     */
    public byte[] SPARQLRDFXMLQuery(String query) throws IOException {
        return SPARQLRDFXMLQuery(query, null);
    }

    /**
     * CONSTRUCT against Virtuoso.
     * <ul>
     *   <li><b>Public</b> resource URI: {@code default-graph-uri} is the configured public {@code defaultGraph}
     *       (unchanged from legacy behavior).</li>
     *   <li><b>User/private</b> resource URI: {@code default-graph-uri} is <em>omitted</em> from the HTTP URL; the
     *       query must include {@code FROM} for both public and user graphs (see {@link #fromClauseForPrivateFetch}).</li>
     * </ul>
     *
     * @param resourceUriForDefaultGraph object identity URI in the SPARQL template; null is treated as public
     */
    public byte[] SPARQLRDFXMLQuery(String query, String resourceUriForDefaultGraph) throws IOException {
        RestTemplate restTemplate = new RestTemplate();
        HashMap<String, String> params = new HashMap<>();
        params.put("query", query);
        params.put("format", "application/rdf+xml");

        String user = usernameFromUserResourceUri(resourceUriForDefaultGraph);
        boolean privateResource = user != null && !user.isBlank();

        String url;
        if (privateResource) {
            url = ConfigUtil.get("sparqlEndpoint").asText() + "?query={query}&format={format}";
        } else {
            params.put("default-graph-uri", ConfigUtil.get("defaultGraph").asText());
            url = ConfigUtil.get("sparqlEndpoint").asText()
                    + "?default-graph-uri={default-graph-uri}&query={query}&format={format}";
        }

        HttpHeaders headers = new HttpHeaders();
        headers.add("Accept", "*/*");
        HttpEntity<?> entity = new HttpEntity<>(headers);

        ResponseEntity<byte[]> response = restTemplate.exchange(url, HttpMethod.GET, entity, byte[].class, params);
        return response.getBody() != null ? response.getBody() : new byte[0];
    }

    /**
     * SPARQL {@code FROM} clause fragment for {@code FetchSBOLNonRecursive.sparql}:
     * empty for public URIs (use {@code default-graph-uri} on the request); for user-scoped URIs returns
     * {@code FROM <publicDefaultGraph> FROM <userNamedGraph>} so CONSTRUCT reads both graphs without
     * {@code default-graph-uri}.
     */
    public String fromClauseForPrivateFetch(String resourceUri) throws IOException {
        String user = usernameFromUserResourceUri(resourceUri);
        if (user == null || user.isBlank()) {
            return "";
        }
        String pub = ConfigUtil.get("defaultGraph").asText();
        String priv = instanceUriPrefixForGraphs() + "user/" + user;
        return "FROM <" + pub + "> FROM <" + priv + ">";
    }

    /** Base URL for RDF URIs; prefers {@code uriPrefix} when set, else {@code graphPrefix}. */
    private String instanceUriPrefixForGraphs() throws IOException {
        JsonNode n = ConfigUtil.get("uriPrefix");
        if (n != null && !n.isNull()) {
            String t = n.asText().trim();
            if (!t.isEmpty()) {
                return t.endsWith("/") ? t : t + "/";
            }
        }
        return ConfigUtil.get("graphPrefix").asText();
    }

    /**
     * Returns the username segment for URIs of the form {@code (graphPrefix|uriPrefix) + "user/" + username + "/..."}.
     */
    private String usernameFromUserResourceUri(String resourceUri) throws IOException {
        if (resourceUri == null || resourceUri.isBlank()) {
            return null;
        }
        String gpHead = ConfigUtil.get("graphPrefix").asText() + "user/";
        String uriPrefixHead = instanceUriPrefixForGraphs() + "user/";
        if (resourceUri.startsWith(gpHead)) {
            String rest = resourceUri.substring(gpHead.length());
            int slash = rest.indexOf('/');
            if (slash > 0) {
                return rest.substring(0, slash);
            }
        }
        if (!gpHead.equals(uriPrefixHead) && resourceUri.startsWith(uriPrefixHead)) {
            String rest = resourceUri.substring(uriPrefixHead.length());
            int slash = rest.indexOf('/');
            if (slash > 0) {
                return rest.substring(0, slash);
            }
        }
        return null;
    }

    /**
     * Hit the /sparql endpoint on other SBH instances (Web of Registries).
     * Aligns with {@link #SPARQLRDFXMLQuery}: CONSTRUCT needs {@code format} + default graph + permissive Accept;
     * {@code String} responses often end up null for RDF MIME types.
     */
    public byte[] queryOldSBHSparqlEndpoint(String WOREndpoint, String query) throws IOException {
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.add("Accept", "*/*");

        String base = WOREndpoint.endsWith("/") ? WOREndpoint.substring(0, WOREndpoint.length() - 1) : WOREndpoint;
        String remoteDefaultGraph = base + "/public";

        HashMap<String, String> params = new HashMap<>();
        params.put("default-graph-uri", remoteDefaultGraph);
        params.put("query", query);
        params.put("format", "application/rdf+xml");

        String url = base + "/sparql?default-graph-uri={default-graph-uri}&query={query}&format={format}";
        HttpEntity<?> entity = new HttpEntity<>(headers);

        ResponseEntity<byte[]> rest;
        try {
            rest = restTemplate.exchange(url, HttpMethod.GET, entity, byte[].class, params);
        } catch (HttpClientErrorException e) {
            int status = e.getStatusCode().value();
            // Remote registry may reject unauthenticated SPARQL (401) or content negotiation (406); treat as no data.
            if (status == HttpStatus.NOT_ACCEPTABLE.value() || status == HttpStatus.UNAUTHORIZED.value()) {
                return new byte[0];
            }
            throw e;
        }
        byte[] body = rest.getBody();
        return body != null && body.length > 0 ? body : new byte[0];
    }

    /**
     * Virtuoso named graph for RDF stored under this user's account ({@link User#getGraphUri()} when set,
     * otherwise derived from configured {@code graphPrefix} — same derivation as anonymous
     * would use after login).
     */
    public String resolveUserNamedGraphUri(User user) throws IOException {
        String g = user.getGraphUri();
        if (g != null && !g.isBlank()) {
            return g;
        }
        return ConfigUtil.get("graphPrefix").asText() + "user/" + user.getUsername();
    }

    /**
     * Objects shared via {@code sbh:canView} triples stored in the viewer's named graph (legacy {@code /shared} JSON).
     */
    public ArrayNode getSharedObjectsJSON(User user) throws IOException, JsonProcessingException {
        ObjectMapper mapper = new ObjectMapper();
        ArrayNode out = mapper.createArrayNode();

        String databasePrefix = ConfigUtil.get("databasePrefix").asText();
        String userResourceUri = sparqlService.userSynbiohubMemberUri(user.getUsername());
        String userGraphUri = resolveUserNamedGraphUri(user);

        JsonNode saltNode = ConfigUtil.get("shareLinkSalt");
        String shareLinkSalt = (saltNode == null || saltNode.isNull()) ? "" : saltNode.asText();

        String canViewRaw = sparqlService.read(sparqlService.sparqlQueryUrl(), userGraphUri, sparqlService.getSharedCanViewSPARQL(userResourceUri));
        JsonNode bindings = sparqlBindingsArray(mapper, canViewRaw);
        if (!bindings.isArray()) {
            return out;
        }

        for (JsonNode b : bindings) {
            JsonNode objSlot = b.path("object");
            if (!objSlot.hasNonNull("value")) {
                continue;
            }
            String sharedUri = objSlot.path("value").asText("");
            if (sharedUri.isEmpty()) {
                continue;
            }

            String metaGraphUri = graphUriFromSharedTopLevelUri(sharedUri, user);
            String metaRaw = sparqlService.read(sparqlService.sparqlQueryUrl(), metaGraphUri, sparqlService.getTopLevelMetadataSPARQL(sharedUri));
            JsonNode metaBindings = sparqlBindingsArray(mapper, metaRaw);
            if (!metaBindings.isArray() || metaBindings.size() == 0) {
                continue;
            }

            ObjectNode row = sparqlBindingRowToObjectNodePreserveKeys(mapper, metaBindings.get(0));

            String pi = row.path("persistentIdentity").asText("");
            String version = row.path("version").asText("");
            String versionedUri = !pi.isEmpty() ? pi + "/" + version : sharedUri;

            row.put("uri", versionedUri);
            row.put("url", computeSharedListingBrowserPath(databasePrefix, versionedUri, shareLinkSalt));

            out.add(row);
        }

        return out;
    }

    public ArrayNode mergeManageResults(String publicRawJSON, String privateRawJSON) throws JsonProcessingException {
        ObjectMapper mapper = new ObjectMapper();
        ArrayNode results = mapper.createArrayNode();
        Set<String> seenUris = new HashSet<>();

        JsonNode publicBindings = sparqlBindingsArray(mapper, publicRawJSON);
        if (publicBindings.isArray()) {
            for (JsonNode node : publicBindings) {
                ObjectNode part = bindingToObjectNode(mapper, node);
                part.put("triplestore", "public");
                seenUris.add(part.get("uri").asText());
                results.add(part);
            }
        }

        JsonNode privateBindings = sparqlBindingsArray(mapper, privateRawJSON);
        if (privateBindings.isArray()) {
            for (JsonNode node : privateBindings) {
                ObjectNode part = bindingToObjectNode(mapper, node);
                if (!seenUris.contains(part.get("uri").asText())) {
                    part.put("triplestore", "private");
                    results.add(part);
                }
            }
        }

        return results;
    }

    /**
     * Legacy {@code getGraphUriFromTopLevelUri}: which Virtuoso graph holds metadata for a top-level RDF URI?
     */
    private String graphUriFromSharedTopLevelUri(String topLevelUri, User user) throws IOException {
        String databasePrefix = ConfigUtil.get("databasePrefix").asText();
        String defaultGraph = ConfigUtil.get("defaultGraph").asText();

        String publicStem = databasePrefix + "public/";
        if (topLevelUri.startsWith(publicStem)) {
            return defaultGraph;
        }

        String viewerGraph = resolveUserNamedGraphUri(user);
        if (topLevelUri.startsWith(viewerGraph)) {
            return viewerGraph;
        }

        int userSeg = topLevelUri.indexOf("/user/");
        if (userSeg >= 0) {
            int afterUserKw = userSeg + "/user/".length();
            int slashAfterName = topLevelUri.indexOf('/', afterUserKw);
            if (slashAfterName >= 0) {
                return topLevelUri.substring(0, slashAfterName);
            }
            return topLevelUri;
        }

        return defaultGraph;
    }

    /**
     * {@code '/' + strippedUri + '/' + sha1(...) + '/share'} (legacy {@code shared.js}).
     */
    private static String computeSharedListingBrowserPath(String databasePrefix, String versionedUri,
                                                           String shareLinkSalt) {
        String rel = versionedUri;
        if (!databasePrefix.isEmpty() && rel.startsWith(databasePrefix)) {
            rel = rel.substring(databasePrefix.length());
        }
        while (rel.startsWith("/")) {
            rel = rel.substring(1);
        }
        String token = shareLinkTokenSynbiohubHex(versionedUri, shareLinkSalt);
        return "/" + rel + "/" + token + "/share";
    }

    /** {@code SHA1_HEX('synbiohub_' + SHA1_HEX(versioned_uri_utf8) + shareLinkSalt)} per legacy Node hashes. */
    private static String shareLinkTokenSynbiohubHex(String versionedUri, String shareLinkSalt) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-1");
            String innerHex = bytesToSha1HexLower(md.digest(versionedUri.getBytes(StandardCharsets.UTF_8)));
            md.reset();
            String outerPayload = "synbiohub_" + innerHex + (shareLinkSalt == null ? "" : shareLinkSalt);
            return bytesToSha1HexLower(md.digest(outerPayload.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-1 not available", e);
        }
    }

    private static String bytesToSha1HexLower(byte[] digest) {
        StringBuilder sb = new StringBuilder(digest.length * 2);
        for (byte b : digest) {
            sb.append(String.format(Locale.US, "%02x", b & 0xff));
        }
        return sb.toString();
    }

}
