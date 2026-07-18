import SPARQL_PREFIXES from './prefixes';

const query = `${SPARQL_PREFIXES}
SELECT ?object (COUNT(DISTINCT ?tl) AS ?count)
$from
WHERE {
    ?tl sbol2:role ?object .
    ?tl sbh:topLevel ?tl .
    OPTIONAL { ?tl sbol2:displayId ?tlDisplayId . }
    OPTIONAL { ?tl dcterms:title ?tlName . }
    OPTIONAL { ?tl dcterms:description ?tlDescription . }
    $constraints
}
GROUP BY ?object`;

export default query;
