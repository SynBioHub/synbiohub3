package com.synbiohub.sbh3.services;

import com.synbiohub.sbh3.sparql.SPARQLQuery;
import com.synbiohub.sbh3.utils.ConfigUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.jena.rdf.model.Model;
import org.apache.jena.rdf.model.ModelFactory;
import org.apache.jena.riot.RDFDataMgr;
import org.apache.jena.riot.RDFFormat;
import org.sbolstandard.core2.SBOLDocument;
import org.sbolstandard.core2.SBOLReader;

import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URI;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Slf4j
public class DownloadService {

    private final SearchService searchService;


    public String getMetadata(String uri) throws IOException {
        String graphPrefix = ConfigUtil.get("graphPrefix").asText();
        URI uriClass = null;
        try {
            uriClass = new URI(uri);
        } catch (Exception e) {
            e.printStackTrace();
        }
//TODO: refactor graph prefix
//        String modifiedUri = graphPrefix + uriClass.getPath().substring(1);     // The path contains a / at the beginning, so does our graph prefix
        var metadataQuery = new SPARQLQuery("src/main/java/com/synbiohub/sbh3/sparql/GetTopLevelMetadata.sparql");
        var args = new HashMap<String, String>();
        args.put("uri", uriClass.toString());
        args.put("offset", "0");
        String query = metadataQuery.loadTemplate(args);
        String results = searchService.SPARQLQuery(query);
        try {
            results = searchService.rawJSONToOutput(results);
        } catch (Exception e) {}
        return results;
    }

    public SBOLDocument getSBOLNonRecursive(String uri) throws IOException {
        String graphPrefix = ConfigUtil.get("graphPrefix").asText();
        URI uriClass = null;
        try {
            uriClass = new URI(uri);
        } catch (Exception e) {
            e.printStackTrace();
        }
//TODO: refactor graph prefix
//        String modifiedUri = graphPrefix + uriClass.getPath().substring(1);     // The path contains a / at the beginning, so does our graph prefix
        var metadataQuery = new SPARQLQuery("src/main/java/com/synbiohub/sbh3/sparql/FetchSBOLNonRecursive.sparql");
        var args = new HashMap<String, String>();
        args.put("uri", uriClass.toString());
        args.put("offset", "0");
        String query = metadataQuery.loadTemplate(args);
        byte[] results = searchService.SPARQLRDFXMLQuery(query);

        // Use libSBOLj to serialize and return
        SBOLDocument document = null;
        try {
            document = SBOLReader.read(new ByteArrayInputStream(results));
        } catch (Exception e) {
            log.error("Error reading RDF to SBOL Document!");
        }
        return document;
    }

    public Model getRecursiveModel(String uri) throws IOException {
        String graphPrefix = ConfigUtil.get("graphPrefix").asText();
        URI uriClass = null;
        try {
            uriClass = new URI(uri);
        } catch (Exception e) {
            e.printStackTrace();
        }

//        String modifiedUri = graphPrefix + uriClass.getPath().substring(1);     // The path contains a / at the beginning, so does our graph prefix
        var metadataQuery = new SPARQLQuery("src/main/java/com/synbiohub/sbh3/sparql/FetchSBOLNonRecursive.sparql");
        var args = new HashMap<String, String>();
        args.put("uri", uriClass.toString());
        args.put("offset", "0");
        String query = metadataQuery.loadTemplate(args);
        byte[] results = searchService.SPARQLRDFXMLQuery(query);
        Model model = ModelFactory.createDefaultModel();
        model.setNsPrefix("sbol2", "http://sbols.org/v2#");
        model.read(new ByteArrayInputStream(results), null);
        if (model.size() >= 10000) {
            int counter = 1;
            var offset = model.size();
            log.info("model size is " + model.size());
            while (model.size() / 10000 >= counter) {    // Limit at 10k; we may need to fetch more than that
                args.replace("offset", Integer.toString((int) offset));
                query = metadataQuery.loadTemplate(args);
                model.read(new ByteArrayInputStream(searchService.SPARQLRDFXMLQuery(query)), null);
                offset = model.size();
                counter++;
            }
        }
        var resolved = new LinkedHashSet<String>();   // list of resolved URI's
        for(var s : model.listSubjects().toSet()) { // Add all subjects to resolved
            resolved.add(s.getURI());
        }
        var unresolved = new LinkedHashSet<String>();  // list of unresolved URI's
        var wor = ConfigUtil.get("webOfRegistries");
        var worIterator = wor.fields();
        // Add all valid objects to unresolved list
        for(var m : model.listStatements().toSet()) {
            if (m.getObject().isURIResource() && !resolved.contains(m.getObject().asResource().getURI()) &&
                    !m.getPredicate().getURI().equals("http://sbols.org/v2#persistentIdentity")) {
                while(worIterator.hasNext()) {
                    if (m.getObject().asResource().getURI().startsWith(worIterator.next().getKey())) {
                        unresolved.add(m.getObject().asResource().getURI());
                    }
                }
                worIterator = wor.fields();
            }
        }

        // Try to resolve all URI's in unresolved
        while(!unresolved.isEmpty()) {
            var subject = unresolved.iterator().next();
            if (!resolved.contains(subject)) {

                // Check if subject contains a WOR URI
                worIterator = wor.fields();
                var worUrl = "";
                while(worIterator.hasNext()) {
                    var next = worIterator.next();
                    if (subject.startsWith(next.getKey())) {
                        worUrl = next.getValue().asText();
                    }
                }
//                var subjectArgs = Collections.singletonMap("uri", subject);
                HashMap<String, String> subjectArgs = new HashMap<>();
                subjectArgs.put("uri", subject);
                subjectArgs.put("offset", "0");
                String subjectQuery = metadataQuery.loadTemplate(subjectArgs);
                byte[] subjectResults;
                if (!worUrl.isEmpty()) {
                    subjectResults = searchService.queryOldSBHSparqlEndpoint(worUrl, subjectQuery);
                } else {
                    subjectResults = searchService.SPARQLRDFXMLQuery(subjectQuery);
                }
                Model tempModel = ModelFactory.createDefaultModel();
                tempModel.read(new ByteArrayInputStream(subjectResults), null);
                if (model.size() > 10000) {
                    int counter = 1;
                    var offset = model.size();
                    log.info("model size is " + model.size());
                    while (model.size() / 10000 >= counter) {    // Limit at 10k; we may need to fetch more than that
                        args.replace("offset", Integer.toString((int) offset));
                        query = metadataQuery.loadTemplate(args);
                        if (!worUrl.isEmpty()) {
                            model.read(new ByteArrayInputStream(searchService.queryOldSBHSparqlEndpoint(worUrl, query)), null);
                        } else {
                            model.read(new ByteArrayInputStream(searchService.SPARQLRDFXMLQuery(query)), null);
                        }
                        offset = model.size();
                        counter++;
                    }
                }
                model = model.union(tempModel); // add new RDF object to original model
                for(var s : tempModel.listSubjects().toSet()) {  // Add all subjects to list of resolved
                    resolved.add(s.getURI());
                }
                worIterator = wor.fields();
                for(var m : tempModel.listStatements().toSet()) { // Add all valid objects to list of resolved
                    if (m.getObject().isURIResource() && !resolved.contains(m.getObject().asResource().getURI()) &&
                            !m.getPredicate().getURI().equals("http://sbols.org/v2#persistentIdentity") &&
                            !m.getPredicate().getURI().equals("http://wiki.synbiohub.org/wiki/Terms/synbiohub#ownedBy")) {
                        while(worIterator.hasNext()) {
                            if (m.getObject().asResource().getURI().startsWith(worIterator.next().getKey())) {
                                unresolved.add(m.getObject().asResource().getURI());
                            }
                        }
                        worIterator = wor.fields();
                    }
                }
            }
            unresolved.remove(subject); // Remove resolved / unresolvable uri from list of unresolved
        }
        return model;
    }

    public SBOLDocument getSBOLRecursive(String uri) throws IOException {
        var results = getRecursiveModel(uri);

        // Write RDF Model to byte stream
        SBOLDocument document = null;
        var modelOutput = new ByteArrayOutputStream();
        RDFDataMgr.write(modelOutput, results, RDFFormat.RDFXML_PLAIN);
        // Use libSBOLj to serialize and return
        try {
            document = SBOLReader.read(new ByteArrayInputStream(modelOutput.toByteArray()));
        } catch (Exception e) {
            log.error("Error reading RDF to SBOL Document!");
            e.printStackTrace();
        }
        return document;
    }

}
