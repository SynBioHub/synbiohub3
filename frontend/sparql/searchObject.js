const query = `PREFIX sbol2: <http://sbols.org/v2#>
PREFIX dcterms: <http://purl.org/dc/terms/>
PREFIX ncbi: <http://www.ncbi.nlm.nih.gov#>
PREFIX synbiohub: <http://synbiohub.org#>
PREFIX sbh: <http://wiki.synbiohub.org/wiki/Terms/synbiohub#>
PREFIX igem: <http://wiki.synbiohub.org/wiki/Terms/igem#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX dc: <http://purl.org/dc/elements/1.1/>
PREFIX cello: <http://cellocad.org/Terms/cello#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX purl: <http://purl.obolibrary.org/obo/>

SELECT DISTINCT
    ?object
$from
WHERE {
    ?subject $predicate ?object .
    ?subject sbh:topLevel ?subject
}
`;

export default query;
