const query = `PREFIX sbol2: <http://sbols.org/v2#>
PREFIX dcterms: <http://purl.org/dc/terms/>
PREFIX synbiohub: <http://synbiohub.org#>
PREFIX dc: <http://purl.org/dc/elements/1.1/>
PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX sbh: <http://wiki.synbiohub.org/wiki/Terms/synbiohub#>

SELECT DISTINCT
       ?mutableDescription
       ?mutableNotes
       ?mutableProvenance
WHERE { 
      <$uri> a ?type .
      OPTIONAL { <$uri> sbh:mutableDescription ?mutableDescription . }
      OPTIONAL { <$uri> sbh:mutableNotes ?mutableNotes . }
      OPTIONAL { <$uri> sbh:mutableProvenance ?mutableProvenance . }
}`;

export default query;
