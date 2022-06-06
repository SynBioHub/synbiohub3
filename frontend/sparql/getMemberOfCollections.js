const query = `
PREFIX sbol2: <http://sbols.org/v2#>
PREFIX dcterms: <http://purl.org/dc/terms/>
SELECT 
  ?subject 
  ?title 
WHERE {
  ?subject a sbol2:Collection .
  ?subject sbol2:member <$uri> .
  OPTIONAL { ?subject dcterms:title ?title } .
}`;

export default query;
