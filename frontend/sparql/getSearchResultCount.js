import SPARQL_PREFIXES from './prefixes';

// Counts the top level objects a standard search matches. Deliberately mirrors
// the facet queries (same ?tl shape, same $constraints) so the total agrees
// with the counts shown next to each facet option.
const query = `${SPARQL_PREFIXES}
SELECT (COUNT(DISTINCT ?tl) AS ?count)
$from
WHERE {
    ?tl a ?tlType .
    ?tl sbh:topLevel ?tl .
    OPTIONAL { ?tl sbol2:displayId ?tlDisplayId . }
    OPTIONAL { ?tl dcterms:title ?tlName . }
    OPTIONAL { ?tl dcterms:description ?tlDescription . }
    $constraints
}`;

export default query;
