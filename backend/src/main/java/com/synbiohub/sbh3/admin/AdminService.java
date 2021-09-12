package com.synbiohub.sbh3.admin;

import lombok.NoArgsConstructor;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@NoArgsConstructor
public class AdminService {

    @Value("${version}")
    private String version;

    @Value("${instanceName}")
    private String instanceName;

    @Value("${instanceUrl}")
    private String instanceUrl;

    @Value("${port}")
    private String port;

    @Value("${triplestore.sparqlEndpoint}")
    private String sparqlEndpoint;

    @Value("${triplestore.graphStoreEndpoint}")
    private String graphStoreEndpoint;

    @Value("${triplestore.defaultGraph}")
    private String defaultGraph;

    @Value("${triplestore.graphPrefix}")
    private String graphPrefix;

    @Value("${databasePrefix}")
    private String databasePrefix;

    @Value("${removePublicEnabled}")
    private Boolean removePublicEnabled;

    @Value("${uploadLimit}")
    private String uploadLimit;

    @Value("${resolveBatch}")
    private String resolveBatch;

    @Value("${fetchLimit}")
    private String fetchLimit;

    @Value("${staggeredQueryLimit}")
    private String staggeredQueryLimit;


    public JSONObject getStatus() {
        return new JSONObject()
        .put("platform", System.getProperty("os.name"))
        .put("architecture", System.getProperty("os.arch"))
        .put("osRelease", System.getProperty("os.version"))
        .put("version", version)  // Version of SynBioHub3. Corresponds with <version> tag in pom.xml.
        .put("instanceName", instanceName)
        .put("instanceUrl", instanceUrl)
        .put("listenPort", port)
        .put("sparqlEndpoint", sparqlEndpoint)
        .put("graphStoreEndpoint", graphStoreEndpoint)
        .put("defaultGraph", defaultGraph)
        .put("graphPrefix", graphPrefix)
        .put("databasePrefix", databasePrefix)
        .put("removePublicEnabled", removePublicEnabled)
        .put("uploadLimit", uploadLimit)
        .put("resolveBatch", resolveBatch)
        .put("fetchLimit", fetchLimit)
        .put("staggeredQueryLimit", staggeredQueryLimit);
    }
}
