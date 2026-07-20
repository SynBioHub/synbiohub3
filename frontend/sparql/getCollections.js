import SPARQL_PREFIXES from './prefixes';

const query = `${SPARQL_PREFIXES}
SELECT ?subject ?displayId ?name (COUNT(DISTINCT ?tl) AS ?count)
WHERE {
      ?subject a sbol2:Collection .
      OPTIONAL { ?subject sbol2:displayId ?displayId . }
      OPTIONAL { ?subject dcterms:title ?name . }
      ?subject sbol2:member ?tl .
      OPTIONAL { ?tl sbol2:displayId ?tlDisplayId . }
      OPTIONAL { ?tl dcterms:title ?tlName . }
      OPTIONAL { ?tl dcterms:description ?tlDescription . }
      $constraints
}
GROUP BY ?subject ?displayId ?name`;

export default query;
