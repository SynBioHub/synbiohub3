package com.synbiohub.sbh3.sparql;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

public class SPARQLQuery {

    private String filename;

    public SPARQLQuery(String filename) {
        this.filename = filename;
    }

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
}
