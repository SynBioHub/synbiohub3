package com.synbiohub.sbh3.sparql;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;

/**
 * Creates a SPARQL query from multiple criterion
 */
public class SearchQuery implements SPARQLQuery {
    private String from;
    private String criteria;
    private String limit;
    private String offset;

    @Value("classpath:data/config.json")
    private Resource config;

    public SearchQuery() {
        from = "";
        criteria = "";
        limit = "";
        offset = "";
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
        String query = "PREFIX sbol2: <http://sbols.org/v2#>\n" +
                "PREFIX dcterms: <http://purl.org/dc/terms/>\n" +
                "PREFIX ncbi: <http://www.ncbi.nlm.nih.gov#>\n" +
                "PREFIX synbiohub: <http://synbiohub.org#>\n" +
                "PREFIX sbh: <http://wiki.synbiohub.org/wiki/Terms/synbiohub#>\n" +
                "PREFIX igem: <http://wiki.synbiohub.org/wiki/Terms/igem#>\n" +
                "PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\n" +
                "PREFIX prov: <http://www.w3.org/ns/prov#>\n" +
                "PREFIX dc: <http://purl.org/dc/elements/1.1/>\n" +
                "PREFIX cello: <http://cellocad.org/Terms/cello#>\n" +
                "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n" +
                "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n" +
                "PREFIX purl: <http://purl.obolibrary.org/obo/>\n" +
                "\n" +
                "SELECT DISTINCT\n" +
                "    ?subject\n" +
                "    ?displayId\n" +
                "    ?version\n" +
                "    ?name\n" +
                "    ?description\n" +
                "    ?type\n" +
                "%s\n" +
                "WHERE {\n" +
                "    %s\n" +
                "\n" +
                "    ?subject a ?type .\n" +
                "    ?subject sbh:topLevel ?subject\n" +
                "    OPTIONAL { ?subject sbol2:displayId ?displayId . }\n" +
                "    OPTIONAL { ?subject sbol2:version ?version . }\n" +
                "    OPTIONAL { ?subject dcterms:title ?name . }\n" +
                "    OPTIONAL { ?subject dcterms:description ?description . }\n" +
                "} \n" +
                "\n" +
                "%s\n" +
                "%s";
        return String.format(query, from, criteria, limit, offset);
    }
}
