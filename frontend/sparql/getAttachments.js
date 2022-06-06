const query = `
PREFIX sbol2: <http://sbols.org/v2#>
PREFIX sbh: <http://wiki.synbiohub.org/wiki/Terms/synbiohub#>

SELECT
       ?p
       ?o
WHERE {
    {
        SELECT
        ?attachment
        WHERE {
           <$uri> sbh:attachment|sbol2:attachment ?attachment
        }
    }
    FILTER (
        ?p = <http://sbols.org/v2#format> ||
        ?p = <http://sbols.org/v2#size> ||
        ?p = <http://purl.org/dc/terms/title> ||
        ?p = <http://wiki.synbiohub.org/wiki/Terms/synbiohub#topLevel>
    )
     ?attachment
     ?p
     ?o
}`;

export default query;