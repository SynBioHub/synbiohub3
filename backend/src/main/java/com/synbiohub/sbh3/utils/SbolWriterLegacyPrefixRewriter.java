package com.synbiohub.sbh3.utils;

import org.w3c.dom.Attr;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NamedNodeMap;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.transform.OutputKeys;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;
import java.io.ByteArrayInputStream;
import java.io.StringWriter;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Rewrites {@link org.sbolstandard.core2.SBOLWriter} RDF/XML so root namespaces match
 * SynBioHub1's legacy layout ({@code sbh}, {@code igem}, {@code dcterms}, …) instead of
 * Jena/SBOLWriter {@code ns*} prefixes and fragment-split xmlns declarations that fail
 * SBOL validator equality / download regression tests.
 * <p>
 * Element nesting from SBOLWriter is preserved; only prefixes / xmlns decls are changed.
 * Non-legacy namespaces that are still used by elements/attributes (e.g. partsregistry
 * {@code j.0}) are kept so the XML stays well-formed.
 */
public final class SbolWriterLegacyPrefixRewriter {

    private static final String RDF_NS = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
    private static final String XMLNS_NS = "http://www.w3.org/2000/xmlns/";

    /** Exact namespace URI → preferred legacy prefix (declaration order on rdf:RDF). */
    private static final Map<String, String> LEGACY_URI_TO_PREFIX = new LinkedHashMap<>();

    static {
        LEGACY_URI_TO_PREFIX.put(RDF_NS, "rdf");
        LEGACY_URI_TO_PREFIX.put("http://purl.org/dc/terms/", "dcterms");
        LEGACY_URI_TO_PREFIX.put("http://www.w3.org/ns/prov#", "prov");
        LEGACY_URI_TO_PREFIX.put("http://sbols.org/v2#", "sbol");
        LEGACY_URI_TO_PREFIX.put("http://www.w3.org/2001/XMLSchema#dateTime/", "xsd");
        LEGACY_URI_TO_PREFIX.put("http://www.ontology-of-units-of-measure.org/resource/om-2/", "om");
        LEGACY_URI_TO_PREFIX.put("http://synbiohub.org#", "synbiohub");
        LEGACY_URI_TO_PREFIX.put("http://wiki.synbiohub.org/wiki/Terms/synbiohub#", "sbh");
        LEGACY_URI_TO_PREFIX.put("http://www.sybio.ncl.ac.uk#", "sybio");
        LEGACY_URI_TO_PREFIX.put("http://www.w3.org/2000/01/rdf-schema#", "rdfs");
        LEGACY_URI_TO_PREFIX.put("http://www.ncbi.nlm.nih.gov#", "ncbi");
        LEGACY_URI_TO_PREFIX.put("http://wiki.synbiohub.org/wiki/Terms/igem#", "igem");
        LEGACY_URI_TO_PREFIX.put("http://www.ncbi.nlm.nih.gov/genbank#", "genbank");
        LEGACY_URI_TO_PREFIX.put("http://sbols.org/genBankConversion#", "gbconv");
        LEGACY_URI_TO_PREFIX.put("http://purl.org/dc/elements/1.1/", "dc");
        LEGACY_URI_TO_PREFIX.put("http://purl.obolibrary.org/obo/", "obo");
    }

    /** Also accept Jena's bare XSD NS and rewrite to SBH1's dateTime/ variant. */
    private static final String XSD_BARE = "http://www.w3.org/2001/XMLSchema#";
    private static final String XSD_LEGACY = "http://www.w3.org/2001/XMLSchema#dateTime/";

    private SbolWriterLegacyPrefixRewriter() {
    }

    /**
     * Rewrite SBOLWriter RDF/XML bytes to legacy SynBioHub1 namespace layout.
     * Returns {@code xml} unchanged on parse/serialize failure.
     */
    public static byte[] rewrite(byte[] xml) {
        if (xml == null || xml.length == 0) {
            return xml;
        }
        try {
            String in = new String(xml, StandardCharsets.UTF_8);
            String out = rewrite(in);
            return out.getBytes(StandardCharsets.UTF_8);
        } catch (Exception e) {
            return xml;
        }
    }

    public static String rewrite(String xml) throws Exception {
        if (xml == null || xml.isBlank()) {
            return xml;
        }
        DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
        dbf.setNamespaceAware(true);
        Document doc = dbf.newDocumentBuilder()
                .parse(new ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8)));
        Element root = doc.getDocumentElement();
        if (root == null || !"RDF".equals(root.getLocalName())) {
            return xml;
        }

        Map<String, String> oldPrefixToUri = collectXmlns(root);
        Map<String, String> oldPrefixToNewPrefix = new LinkedHashMap<>();

        for (Map.Entry<String, String> e : oldPrefixToUri.entrySet()) {
            String oldPrefix = e.getKey();
            String uri = normalizeUri(e.getValue());
            String legacy = LEGACY_URI_TO_PREFIX.get(uri);
            if (legacy != null && !legacy.equals(oldPrefix)) {
                oldPrefixToNewPrefix.put(oldPrefix, legacy);
            }
        }

        renamePrefixedNodes(root, oldPrefixToNewPrefix);

        // Prefixes still used by elements/attrs after remap (keeps partsregistry / custom NS).
        Map<String, String> usedPrefixToUri = collectUsedPrefixes(root);

        // Rebuild rdf:RDF xmlns: legacy set first, then any still-used non-legacy prefixes.
        stripAllXmlns(root);
        Set<String> declared = new LinkedHashSet<>();
        for (Map.Entry<String, String> e : LEGACY_URI_TO_PREFIX.entrySet()) {
            root.setAttributeNS(XMLNS_NS, "xmlns:" + e.getValue(), e.getKey());
            declared.add(e.getValue());
        }
        for (Map.Entry<String, String> e : usedPrefixToUri.entrySet()) {
            String prefix = e.getKey();
            if (prefix == null || prefix.isEmpty() || declared.contains(prefix)) {
                continue;
            }
            if ("xml".equals(prefix) || "xmlns".equals(prefix)) {
                continue;
            }
            String uri = normalizeUri(e.getValue());
            // Skip if this URI already has a legacy prefix declared.
            if (LEGACY_URI_TO_PREFIX.containsKey(uri)) {
                continue;
            }
            root.setAttributeNS(XMLNS_NS, "xmlns:" + prefix, uri);
            declared.add(prefix);
        }

        String serialized = serialize(doc);
        serialized = normalizeXmlDeclaration(serialized);
        return serialized;
    }

    private static String normalizeUri(String uri) {
        if (XSD_BARE.equals(uri)) {
            return XSD_LEGACY;
        }
        return uri;
    }

    private static Map<String, String> collectXmlns(Element root) {
        Map<String, String> map = new LinkedHashMap<>();
        NamedNodeMap attrs = root.getAttributes();
        for (int i = 0; i < attrs.getLength(); i++) {
            Attr a = (Attr) attrs.item(i);
            String name = a.getName();
            if ("xmlns".equals(name)) {
                map.put("", a.getValue());
            } else if (name.startsWith("xmlns:")) {
                map.put(name.substring("xmlns:".length()), a.getValue());
            }
        }
        return map;
    }

    private static Map<String, String> collectUsedPrefixes(Element root) {
        Map<String, String> used = new LinkedHashMap<>();
        collectUsedPrefixesRecursive(root, used);
        return used;
    }

    private static void collectUsedPrefixesRecursive(Element el, Map<String, String> used) {
        String prefix = el.getPrefix();
        if (prefix != null && !prefix.isEmpty() && el.getNamespaceURI() != null) {
            used.putIfAbsent(prefix, el.getNamespaceURI());
        }
        NamedNodeMap attrs = el.getAttributes();
        for (int i = 0; i < attrs.getLength(); i++) {
            Attr a = (Attr) attrs.item(i);
            String ap = a.getPrefix();
            if (ap != null && !ap.isEmpty() && !"xmlns".equals(ap) && a.getNamespaceURI() != null) {
                used.putIfAbsent(ap, a.getNamespaceURI());
            }
        }
        NodeList children = el.getChildNodes();
        for (int i = 0; i < children.getLength(); i++) {
            Node n = children.item(i);
            if (n.getNodeType() == Node.ELEMENT_NODE) {
                collectUsedPrefixesRecursive((Element) n, used);
            }
        }
    }

    private static void stripAllXmlns(Element root) {
        List<Attr> toRemove = new ArrayList<>();
        NamedNodeMap attrs = root.getAttributes();
        for (int i = 0; i < attrs.getLength(); i++) {
            Attr a = (Attr) attrs.item(i);
            String name = a.getName();
            if ("xmlns".equals(name) || name.startsWith("xmlns:")) {
                toRemove.add(a);
            }
        }
        for (Attr a : toRemove) {
            root.removeAttributeNode(a);
        }
    }

    private static void renamePrefixedNodes(Element el, Map<String, String> oldToNew) {
        String prefix = el.getPrefix();
        if (prefix != null && oldToNew.containsKey(prefix)) {
            String newPrefix = oldToNew.get(prefix);
            String ns = el.getNamespaceURI();
            if (XSD_BARE.equals(ns)) {
                ns = XSD_LEGACY;
            }
            el.getOwnerDocument().renameNode(el, ns, newPrefix + ":" + el.getLocalName());
        }

        NamedNodeMap attrs = el.getAttributes();
        // Copy list; renameNode can mutate the live map.
        List<Attr> attrList = new ArrayList<>();
        for (int i = 0; i < attrs.getLength(); i++) {
            attrList.add((Attr) attrs.item(i));
        }
        for (Attr a : attrList) {
            String ap = a.getPrefix();
            if (ap != null && oldToNew.containsKey(ap) && !"xmlns".equals(ap)) {
                String newPrefix = oldToNew.get(ap);
                String ns = a.getNamespaceURI();
                if (XSD_BARE.equals(ns)) {
                    ns = XSD_LEGACY;
                }
                el.getOwnerDocument().renameNode(a, ns, newPrefix + ":" + a.getLocalName());
            }
        }

        NodeList children = el.getChildNodes();
        for (int i = 0; i < children.getLength(); i++) {
            Node n = children.item(i);
            if (n.getNodeType() == Node.ELEMENT_NODE) {
                renamePrefixedNodes((Element) n, oldToNew);
            }
        }
    }

    private static String serialize(Document doc) throws Exception {
        TransformerFactory tf = TransformerFactory.newInstance();
        Transformer t = tf.newTransformer();
        t.setOutputProperty(OutputKeys.OMIT_XML_DECLARATION, "no");
        t.setOutputProperty(OutputKeys.ENCODING, "UTF-8");
        t.setOutputProperty(OutputKeys.INDENT, "yes");
        t.setOutputProperty("{http://xml.apache.org/xslt}indent-amount", "2");
        StringWriter sw = new StringWriter();
        t.transform(new DOMSource(doc), new StreamResult(sw));
        return sw.toString();
    }

    private static String normalizeXmlDeclaration(String s) {
        if (s.startsWith("<?xml version=\"1.0\" encoding=\"UTF-8\"?>")) {
            return s;
        }
        if (s.startsWith("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>")) {
            return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>"
                    + s.substring("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>".length());
        }
        if (s.startsWith("<?xml version=\"1.0\"?>")) {
            return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" + s.substring("<?xml version=\"1.0\"?>".length());
        }
        if (s.startsWith("<?xml version=\"1.0\" ?>")) {
            return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" + s.substring("<?xml version=\"1.0\" ?>".length());
        }
        return s;
    }
}
