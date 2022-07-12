const query = `
PREFIX sbh: <http://wiki.synbiohub.org/wiki/Terms/synbiohub#>
PREFIX purl: <http://purl.obolibrary.org/obo/>

SELECT DISTINCT
       ?mutableDescription
       ?mutableNotes
       ?mutableProvenance
WHERE { 
      <$uri> a ?type .
      OPTIONAL { <$uri> sbh:mutableDescription ?mutableDescription . }
      OPTIONAL { <$uri> sbh:mutableNotes ?mutableNotes . }
      OPTIONAL { <$uri> sbh:mutableProvenance ?mutableProvenance . }
}
`;

export default query;
