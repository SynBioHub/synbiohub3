package com.synbiohub.sbh3.services;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.synbiohub.sbh3.sparql.SPARQLQuery;
import com.synbiohub.sbh3.utils.ConfigUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.jena.rdf.model.Model;
import org.apache.jena.rdf.model.ModelFactory;
import org.apache.jena.rdf.model.RDFNode;
import org.apache.jena.rdf.model.ResourceFactory;
import org.apache.jena.datatypes.RDFDatatype;
import org.apache.jena.datatypes.TypeMapper;
import org.apache.jena.riot.Lang;
import org.apache.jena.riot.RDFDataMgr;
import org.apache.jena.riot.RDFFormat;
import org.apache.jena.riot.RiotException;
import org.sbolstandard.core2.ComponentDefinition;
import org.sbolstandard.core2.SBOLConversionException;
import org.sbolstandard.core2.SBOLDocument;
import org.sbolstandard.core2.SBOLReader;
import org.sbolstandard.core2.Sequence;
import org.sbolstandard.core2.SBOLValidationException;
import org.sbolstandard.core2.SBOLWriter;

import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Slf4j
public class DownloadService {

    private static final int FASTA_WRAP_WIDTH = 70;

    private final SearchService searchService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Legacy-style public object URI: {@code databasePrefix + "public/" + db + "/" + id + "/" + ver}.
     */
    public String publicVersionedObjectUri(String db, String id, String ver) throws IOException {
        return ConfigUtil.get("databasePrefix").asText() + "public/" + db + "/" + id + "/" + ver;
    }

    /**
     * User-namespace object URI: {@code graphPrefix + "user/" + username + "/" + db + "/" + id + "/" + ver}.
     */
    public String userVersionedObjectUri(String username, String db, String id, String ver) throws IOException {
        return ConfigUtil.get("graphPrefix").asText() + "user/" + username + "/" + db + "/" + id + "/" + ver;
    }

    public String publicPersistentIdentityUri(String db, String id) throws IOException {
        return ConfigUtil.get("databasePrefix").asText() + "public/" + db + "/" + id;
    }

    public String userPersistentIdentityUri(String username, String db, String id) throws IOException {
        return ConfigUtil.get("graphPrefix").asText() + "user/" + username + "/" + db + "/" + id;
    }

    /**
     * Resolves persistent identity to the latest versioned identity URI (SPARQL), or null if none.
     */
    public String resolveLatestVersionedUri(String persistentIdentityUri) throws IOException {
        var q = new SPARQLQuery("src/main/java/com/synbiohub/sbh3/sparql/ResolveLatestVersionByPersistentIdentity.sparql");
        var args = new HashMap<String, String>();
        args.put("persistentIdentity", "<" + persistentIdentityUri + ">");
        String query = q.loadTemplate(args);
        String json = searchService.SPARQLQuery(query);
        try {
            JsonNode bindings = objectMapper.readTree(json).path("results").path("bindings");
            if (!bindings.isArray() || bindings.isEmpty()) {
                return null;
            }
            JsonNode uriNode = bindings.get(0).path("uri").path("value");
            if (uriNode.isMissingNode() || uriNode.asText().isBlank()) {
                return null;
            }
            return uriNode.asText();
        } catch (JsonProcessingException e) {
            log.warn("Failed to parse version-resolution SPARQL JSON", e);
            return null;
        }
    }

    /**
     * Recursive SBOL2 closure as RDF/XML (libSBOLj), or null if nothing to serialize.
     */
    public byte[] getSbol2RdfXmlBytes(String topLevelUri) throws IOException {
        SBOLDocument doc = getSBOLRecursive(topLevelUri);
        if (doc == null || doc.getTopLevels().isEmpty()) {
            return null;
        }
        var out = new ByteArrayOutputStream();
        try {
            doc.write(out);
        } catch (SBOLConversionException e) {
            log.error("Failed to serialize SBOL to RDF/XML", e);
            return null;
        }
        return out.toByteArray();
    }

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

    /**
     * Non-recursive SBOL RDF/XML for /sbolnr.
     * <p>
     * When Virtuoso returns RDF/XML ({@code format=application/rdf+xml}), pass the bytes through unchanged so the
     * response matches legacy SynBioHub (typed elements like {@code sbol:ComponentDefinition}, familiar prefixes).
     * Jena {@link RDFFormat#RDFXML_PLAIN} re-serializes as generic {@code rdf:Description} + {@code ns1} prefixes.
     * <p>
     * For Turtle / JSON bindings, parse into a model and try relaxed {@link SBOLReader}/{@link SBOLWriter}; fall back
     * to Jena {@link RDFFormat#RDFXML}.
     */
    public byte[] getSBOLNonRecursiveRdfXmlBytes(String uri) throws IOException {
        URI uriClass;
        try {
            uriClass = new URI(uri);
        } catch (Exception e) {
            throw new IOException("Invalid object URI: " + uri, e);
        }
        var metadataQuery = new SPARQLQuery("src/main/java/com/synbiohub/sbh3/sparql/FetchSBOLNonRecursive.sparql");
        var args = new HashMap<String, String>();
        args.put("uri", uriClass.toString());
        args.put("offset", "0");
        String query = metadataQuery.loadTemplate(args);
        byte[] raw = searchService.SPARQLRDFXMLQuery(query);

        if (isLikelyXmlRdfResponse(raw)) {
            return raw;
        }

        Model model = ModelFactory.createDefaultModel();
        registerSbolNrPrefixes(model);
        readConstructResponseIntoModel(model, raw);

        synchronized (DownloadService.class) {
            boolean prevCompliant = SBOLReader.isCompliant();
            boolean prevReadKeep = SBOLReader.isKeepGoing();
            boolean prevWriteKeep = SBOLWriter.isKeepGoing();
            try {
                SBOLReader.setCompliant(false);
                SBOLReader.setKeepGoing(true);
                SBOLWriter.setKeepGoing(true);
                var rdfXml = new ByteArrayOutputStream();
                RDFDataMgr.write(rdfXml, model, RDFFormat.RDFXML);
                SBOLDocument doc = SBOLReader.read(new ByteArrayInputStream(rdfXml.toByteArray()));
                var out = new ByteArrayOutputStream();
                SBOLWriter.write(doc, out);
                return out.toByteArray();
            } catch (SBOLValidationException | SBOLConversionException | IOException e) {
                log.warn("/sbolnr: libSBOLj serialize skipped ({}), using Jena RDF/XML", e.getMessage());
                var out = new ByteArrayOutputStream();
                RDFDataMgr.write(out, model, RDFFormat.RDFXML);
                return out.toByteArray();
            } finally {
                SBOLReader.setCompliant(prevCompliant);
                SBOLReader.setKeepGoing(prevReadKeep);
                SBOLWriter.setKeepGoing(prevWriteKeep);
            }
        }
    }

    private static void registerSbolNrPrefixes(Model model) {
        model.setNsPrefix("sbol", "http://sbols.org/v2#");
        model.setNsPrefix("sbol2", "http://sbols.org/v2#");
        model.setNsPrefix("dcterms", "http://purl.org/dc/terms/");
        model.setNsPrefix("prov", "http://www.w3.org/ns/prov#");
        model.setNsPrefix("sbh", "http://wiki.synbiohub.org/wiki/Terms/synbiohub#");
        model.setNsPrefix("igem", "http://wiki.synbiohub.org/wiki/Terms/igem#");
        model.setNsPrefix("dc", "http://purl.org/dc/elements/1.1/");
    }

    private static boolean isLikelyXmlRdfResponse(byte[] raw) {
        if (raw == null || raw.length < 20) {
            return false;
        }
        int i = 0;
        while (i < raw.length && (raw[i] == ' ' || raw[i] == '\n' || raw[i] == '\r' || raw[i] == '\t')) {
            i++;
        }
        if (i < raw.length && raw[i] == (byte) 0xEF && i + 2 < raw.length
                && raw[i + 1] == (byte) 0xBB && raw[i + 2] == (byte) 0xBF) {
            i += 3;
        }
        int max = Math.min(raw.length, i + 256);
        String head = new String(raw, i, max - i, StandardCharsets.UTF_8).trim();
        if (head.startsWith("<?xml")) {
            return true;
        }
        String start = head.length() >= 9 ? head.substring(0, 9).toLowerCase() : head.toLowerCase();
        return start.startsWith("<rdf:rdf") || start.startsWith("<rdf:");
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
        readConstructResponseIntoModel(model, results);
        if (model.size() >= 10000) {
            int counter = 1;
            var offset = model.size();
            log.info("model size is " + model.size());
            while (model.size() / 10000 >= counter) {    // Limit at 10k; we may need to fetch more than that
                args.replace("offset", Integer.toString((int) offset));
                query = metadataQuery.loadTemplate(args);
                readConstructResponseIntoModel(model, searchService.SPARQLRDFXMLQuery(query));
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
                readConstructResponseIntoModel(tempModel, subjectResults);

                if (model.size() > 10000) {
                    int counter = 1;
                    var offset = model.size();
                    log.info("model size is " + model.size());
                    while (model.size() / 10000 >= counter) {    // Limit at 10k; we may need to fetch more than that
                        args.replace("offset", Integer.toString((int) offset));
                        query = metadataQuery.loadTemplate(args);
                        if (!worUrl.isEmpty()) {
                            readConstructResponseIntoModel(model, searchService.queryOldSBHSparqlEndpoint(worUrl, query));
                        } else {
                            readConstructResponseIntoModel(model, searchService.SPARQLRDFXMLQuery(query));
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

    /**
     * SynBioHub1-style FASTA headers: {@code >BBa_B0034 sequence 1 (12 bp)} (no space after {@code >}), then sequence
     * lines wrapped at 70 columns.
     *
     * @param pathDisplayId URL {@code {id}} segment (e.g. BBa_B0034), used when the CD has no displayId
     */
    public String buildLegacyFastaForTopLevel(SBOLDocument doc, String topLevelUri, String pathDisplayId) {
        if (doc == null) {
            return "";
        }
        URI identity;
        try {
            identity = URI.create(topLevelUri);
        } catch (IllegalArgumentException e) {
            return "";
        }

        ComponentDefinition cd = doc.getComponentDefinition(identity);
        if (cd != null) {
            String metaName = firstNonBlank(cd.getDisplayId(), cd.getName(), pathDisplayId);
            var sequences = cd.getSequences();
            if (sequences == null || sequences.isEmpty()) {
                return "";
            }
            List<Sequence> ordered = new ArrayList<>(sequences);
            ordered.sort(Comparator.comparing(s -> firstNonBlank(
                    s.getDisplayId(), s.getIdentity() != null ? s.getIdentity().toString() : "")));
            StringBuilder out = new StringBuilder();
            int idx = 1;
            for (Sequence seq : ordered) {
                if (idx > 1) {
                    out.append('\n');
                }
                String elements = Objects.toString(seq.getElements(), "");
                out.append(formatLegacyFastaRecord(
                        metaName, idx, elements.length(), unitsForSequence(seq), elements));
                idx++;
            }
            return out.toString();
        }

        Sequence seq = doc.getSequence(identity);
        if (seq != null) {
            String name = firstNonBlank(pathDisplayId, seq.getDisplayId(), seq.getName());
            String elements = Objects.toString(seq.getElements(), "");
            return formatLegacyFastaRecord(name, 1, elements.length(), unitsForSequence(seq), elements);
        }
        return "";
    }

    private static String firstNonBlank(String... parts) {
        if (parts == null) {
            return "";
        }
        for (String p : parts) {
            if (p != null && !p.isBlank()) {
                return p;
            }
        }
        return "";
    }

    private static String unitsForSequence(Sequence seq) {
        if (seq.getEncoding() != null && Sequence.IUPAC_PROTEIN.equals(seq.getEncoding())) {
            return "aa";
        }
        if (seq.getEncoding() != null) {
            String enc = seq.getEncoding().toString().toLowerCase();
            if (enc.contains("protein") || enc.contains("amino")) {
                return "aa";
            }
        }
        return "bp";
    }

    private static String formatLegacyFastaRecord(String headerName, int sequenceIndex, int length, String units, String elements) {
        String body = elements != null ? elements : "";
        return ">" + headerName + " sequence " + sequenceIndex + " (" + length + " " + units + ")\n" + wrapFastaBody(body);
    }

    private static String wrapFastaBody(String elements) {
        if (elements.isEmpty()) {
            return "";
        }
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < elements.length(); i += FASTA_WRAP_WIDTH) {
            int end = Math.min(i + FASTA_WRAP_WIDTH, elements.length());
            sb.append(elements, i, end);
            if (end < elements.length()) {
                sb.append('\n');
            }
        }
        return sb.toString();
    }

    /**
     * Merges a SPARQL CONSTRUCT (or compatible) HTTP body into {@code target}.
     * Virtuoso often returns Turtle even when {@code format=application/rdf+xml}; {@link Model#read(InputStream, String)}
     * content sniffing then throws. We try RDF/XML, Turtle, then N-Triples.
     * <p>
     * Some endpoints wrongly return SPARQL Results JSON ({@code application/sparql-results+json}) instead of RDF;
     * empty {@code bindings} is treated as no triples (no-op). Non-empty {@code s}/{@code p}/{@code o} bindings
     * are merged as a best-effort fallback.
     */
    private void readConstructResponseIntoModel(Model target, byte[] results) throws IOException {
        if (results == null || results.length == 0) {
            return;
        }
        if (looksLikeSparqlResultsJson(results)) {
            if (mergeSparqlResultsJsonIfApplicable(target, results)) {
                return;
            }
        }
        List<Lang> formats = Arrays.asList(Lang.RDFXML, Lang.TURTLE, Lang.NTRIPLES);
        RiotException last = null;
        for (Lang lang : formats) {
            try {
                RDFDataMgr.read(target, new ByteArrayInputStream(results), lang);
                return;
            } catch (RiotException e) {
                last = e;
            }
        }
        throw new IOException(
                "Could not parse SPARQL RDF response as RDF/XML, Turtle, or N-Triples. Preview: " + previewBytes(results),
                last);
    }

    private static boolean looksLikeSparqlResultsJson(byte[] results) {
        String head = previewBytes(results);
        String t = head.trim();
        return t.startsWith("{") && t.contains("\"results\"") && t.contains("\"head\"");
    }

    /**
     * @return true if handled (including empty bindings — no triples)
     */
    private boolean mergeSparqlResultsJsonIfApplicable(Model target, byte[] results) throws IOException {
        JsonNode root;
        try {
            root = objectMapper.readTree(results);
        } catch (JsonProcessingException e) {
            return false;
        }
        JsonNode bindings = root.path("results").path("bindings");
        if (!bindings.isArray()) {
            return true;
        }
        if (bindings.isEmpty()) {
            return true;
        }
        for (JsonNode row : bindings) {
            JsonNode sj = row.get("s");
            JsonNode pj = row.get("p");
            JsonNode oj = row.get("o");
            if (sj == null || pj == null || oj == null) {
                log.warn("SPARQL JSON row missing s/p/o; skipping row");
                continue;
            }
            try {
                target.add(
                        ResourceFactory.createResource(sj.path("value").asText()),
                        ResourceFactory.createProperty(pj.path("value").asText()),
                        bindingValueToRdfNode(oj));
            } catch (Exception e) {
                log.warn("Could not merge SPARQL JSON binding row: {}", e.getMessage());
            }
        }
        return true;
    }

    private static RDFNode bindingValueToRdfNode(JsonNode term) {
        String type = term.path("type").asText("");
        String value = term.path("value").asText("");
        String datatype = term.path("datatype").isMissingNode() ? null : term.path("datatype").asText();
        return switch (type) {
            case "uri" -> ResourceFactory.createResource(value);
            case "bnode" -> ResourceFactory.createResource();
            case "literal", "typed-literal" -> {
                if (datatype != null && !datatype.isEmpty()) {
                    RDFDatatype dt = TypeMapper.getInstance().getSafeTypeByName(datatype);
                    yield ResourceFactory.createTypedLiteral(value, dt);
                }
                yield ResourceFactory.createPlainLiteral(value);
            }
            default -> ResourceFactory.createPlainLiteral(value);
        };
    }

    private static String previewBytes(byte[] results) {
        int n = Math.min(120, results.length);
        return new String(results, 0, n, StandardCharsets.UTF_8).replace('\n', ' ').replace('\r', ' ');
    }

}
