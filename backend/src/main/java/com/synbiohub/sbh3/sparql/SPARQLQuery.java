package com.synbiohub.sbh3.sparql;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

public class SPARQLQuery {

    private final String filename;

    /**
     * Constructor
     * @param filename File containing the SPARQL query
     */
    public SPARQLQuery(String filename) {
        this.filename = filename;
    }

    /**
     * Loads a specified SPARQL file and parses the key/value pairs within the map
     * Node: Keys must match with the ${key} within the SPARQL file
     * @param args Key/value pairs to parse into the SPARQL file
     * @return String containing a SPARQL query
     */
    public String loadTemplate(Map<String, String> args) {
        String query = "";
        try {
            query = Files.readString(Path.of(filename));
        } catch(IOException e) {
            System.err.println(e + "\nError: SPARQL file not found.");
        }

        for(Map.Entry<String, String> a : args.entrySet()) {
            query = query.replace("$" + a.getKey(), a.getValue());
        }
        return query;
    }

    public String getQuery() {
        String query = "";
        try {
            query = Files.readString(Path.of(filename));
        } catch(IOException e) {
            System.err.println(e + "\nError: SPARQL file not found.");
        }
        return query;
    }
}
