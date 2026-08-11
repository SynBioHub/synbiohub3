const isUri = value => value.startsWith('http');

// escapes a value for use inside a SPARQL "..." string literal.
const escapeSparqlString = value =>
  value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');

// matches ?tl against a value regardless of the value's literal datatype.
const matchClause = (predicate, value, variableName) => {
  if (isUri(value)) {
    return `?tl ${predicate} <${value}> .`;
  }
  return `?tl ${predicate} ${variableName} .\n      FILTER(STR(${variableName}) = "${escapeSparqlString(
    value
  )}")`;
};

const FACET_PREDICATES = {
  creator: 'dc:creator',
  objectType: 'a',
  role: 'sbol2:role',
  sbolType: 'sbol2:type'
};

const singleValueFacetClauses = (properties, excludeFacet, nextVariable) =>
  Object.entries(FACET_PREDICATES)
    .filter(([facet]) => excludeFacet !== facet && properties[facet])
    .map(([facet, predicate]) =>
      matchClause(predicate, properties[facet], nextVariable())
    );

const collectionClauses = (properties, excludeFacet) => {
  if (excludeFacet === 'collections' || !properties.collections?.length) {
    return [];
  }
  // is always a Collection's own subject URI, never a literal.
  const uris = properties.collections
    .map(collection => `<${collection.value}>`)
    .join(' ');
  return [
    `VALUES ?collectionMatch { ${uris} } ?collectionMatch sbol2:member ?tl .`
  ];
};

const extraFilterClauses = (
  properties,
  excludeExtraFilterIndex,
  nextVariable
) =>
  (properties.extraFilters || [])
    .filter(
      (filter, index) =>
        index !== excludeExtraFilterIndex && filter.filter && filter.value
    )
    .map(filter => matchClause(filter.filter, filter.value, nextVariable()));

const textQueryClauses = query => {
  if (!query) {
    return [];
  }
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return words.map(word => {
    const escaped = escapeSparqlString(word);
    return `FILTER(CONTAINS(LCASE(STR(?tlDisplayId)), "${escaped}") || CONTAINS(LCASE(STR(?tlName)), "${escaped}") || CONTAINS(LCASE(STR(?tlDescription)), "${escaped}"))`;
  });
};

// builds the extra WHERE-clause constraints for a facet query, so that
// selecting a value in one facet narrows the options shown in the others.
export default function buildFacetConstraints(
  properties,
  query,
  excludeFacet,
  excludeExtraFilterIndex
) {
  let variableCount = 0;
  const nextVariable = () => `?litMatch${variableCount++}`;

  const clauses = [
    ...singleValueFacetClauses(properties, excludeFacet, nextVariable),
    ...collectionClauses(properties, excludeFacet),
    ...extraFilterClauses(properties, excludeExtraFilterIndex, nextVariable),
    ...textQueryClauses(query)
  ];

  return clauses.join('\n      ');
}
