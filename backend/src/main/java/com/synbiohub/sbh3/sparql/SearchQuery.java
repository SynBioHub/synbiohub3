package com.synbiohub.sbh3.sparql;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

/**
 * Creates a SPARQL query from multiple criterion
 */
public class SearchQuery {
    private String from;
    private String criteria;
    private String limit;
    private String offset;
    private String query;


    public SearchQuery() {
        // Set default graph as public graph
        from = "";
        criteria = "";
        limit = "";
        offset = "";

        // Read in SPARQL file
        try {
            query = Files.readString(Path.of("src/main/java/com/synbiohub/sbh3/sparql/search.sparql"));
        } catch(IOException e) {
            System.err.println(e + "\nError: SPARQL file not found.");
        }
    }

    public void setFrom(String from) {
        this.from = from;
    }

    public void setCriteria(String criteria) {
        this.criteria = criteria;
    }

    public void setLimit(String limit) {
        this.limit = limit;
    }

    public void setOffset(String offset) {
        this.offset = offset;
    }

    public String getSparql() {
        String modifiedQuery = query;
        modifiedQuery = modifiedQuery.replace("$from", from);
        modifiedQuery = modifiedQuery.replace("$criteria", criteria);
        modifiedQuery = modifiedQuery.replace("$limit", limit);
        modifiedQuery = modifiedQuery.replace("$offset", offset);
        return modifiedQuery;
    }
}
