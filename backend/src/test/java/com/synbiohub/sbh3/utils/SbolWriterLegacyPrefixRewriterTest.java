package com.synbiohub.sbh3.utils;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SbolWriterLegacyPrefixRewriterTest {

    @Test
    void remapsNsPrefixesAndDropsFragmentXmlns() throws Exception {
        String input = """
                <?xml version="1.0" ?>
                <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
                         xmlns:ns1="http://sbols.org/v2#"
                         xmlns:ns5="http://wiki.synbiohub.org/wiki/Terms/synbiohub#"
                         xmlns:ns4="http://wiki.synbiohub.org/wiki/Terms/igem#"
                         xmlns:ns3="http://purl.org/dc/terms/"
                         xmlns:ns8="https://synbiohub.org/public/igem/"
                         xmlns:ns9="http://wiki.synbiohub.org/wiki/Terms/igem#partType/"
                         xmlns:xsd="http://www.w3.org/2001/XMLSchema#"
                         xmlns:sbol="http://sbols.org/v2#">
                  <sbol:ComponentDefinition rdf:about="https://synbiohub.org/public/igem/BBa_B0034/1">
                    <ns5:ownedBy rdf:resource="https://synbiohub.org/user/myers"/>
                    <ns4:dominant>true</ns4:dominant>
                    <ns3:title>BBa_B0034</ns3:title>
                  </sbol:ComponentDefinition>
                </rdf:RDF>
                """;

        String out = SbolWriterLegacyPrefixRewriter.rewrite(input);

        assertTrue(out.contains("xmlns:sbh=\"http://wiki.synbiohub.org/wiki/Terms/synbiohub#\""));
        assertTrue(out.contains("xmlns:igem=\"http://wiki.synbiohub.org/wiki/Terms/igem#\""));
        assertTrue(out.contains("xmlns:dcterms=\"http://purl.org/dc/terms/\""));
        assertTrue(out.contains("xmlns:xsd=\"http://www.w3.org/2001/XMLSchema#dateTime/\""));
        assertTrue(out.contains("<sbh:ownedBy"));
        assertTrue(out.contains("<igem:dominant>"));
        assertTrue(out.contains("<dcterms:title>"));
        assertFalse(out.contains("xmlns:ns5="));
        assertFalse(out.contains("xmlns:ns8="));
        assertFalse(out.contains("xmlns:ns9="));
        assertFalse(out.contains("<ns5:"));
        assertFalse(out.contains("xmlns:xsd=\"http://www.w3.org/2001/XMLSchema#\""));
    }
}
