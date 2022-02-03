package com.synbiohub.sbh3.services;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.util.Collections;

@Service
@RequiredArgsConstructor
public class DownloadService {

    private final SearchService searchService;

    @Value("${triplestore.graphPrefix}")
    private String graphPrefix;

    public String getMetadata(String uri) {
        URI uriClass = null;
        try {
            uriClass = new URI(uri);
        } catch (Exception e) {
            e.printStackTrace();
        }
//TODO: refactor graph prefix
        String modifiedUri = graphPrefix + uriClass.getPath().substring(1);     // The path contains a / at the beginning, so does our graph prefix
        var metadataQuery = new SPARQLQuery("src/main/resources/sparql/GetTopLevelMetadata.sparql");
        var args = Collections.singletonMap("uri", modifiedUri);
        String query = metadataQuery.loadTemplate(args);
        String results = searchService.SPARQLQuery(query);
        try {
            results = searchService.rawJSONToOutput(results);
        } catch (Exception e) {}
        return results;
    }
}
