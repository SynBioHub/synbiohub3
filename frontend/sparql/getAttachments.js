const query = `
PREFIX sbol2: <http://sbols.org/v2#>
PREFIX sbh: <http://wiki.synbiohub.org/wiki/Terms/synbiohub#>
PREFIX dcterms: <http://purl.org/dc/terms/>

SELECT DISTINCT
    ?format
    ?size
    ?title
    (?attachment AS ?topLevel)
WHERE {
    {
        SELECT
        ?attachment
        WHERE {
           <$uri> sbh:attachment|sbol2:attachment ?attachment
        }
    }
    ?attachment a ?type .
    OPTIONAL { ?attachment sbol2:format ?format . }
    OPTIONAL { ?attachment sbol2:size ?size . }
    OPTIONAL { ?attachment dcterms:title ?title . }
}`;

export default query;
