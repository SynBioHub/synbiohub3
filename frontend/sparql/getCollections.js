const query = `PREFIX sbol2: <http://sbols.org/v2#>
PREFIX dcterms: <http://purl.org/dc/terms/>
SELECT DISTINCT
       ?subject
       ?displayId
       ?name
$from
WHERE {
      ?subject a sbol2:Collection .
      OPTIONAL { ?subject sbol2:displayId ?displayId . }
      OPTIONAL { ?subject dcterms:title ?name . }
}`;

export default query;
