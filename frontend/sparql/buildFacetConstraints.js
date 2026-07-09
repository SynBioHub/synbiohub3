const wrapValue = value =>
  value.startsWith('http') ? `<${value}>` : `'${value.replace(/'/g, "\\'")}'`;

const FACET_PREDICATES = {
  creator: 'dc:creator',
  objectType: 'a',
  role: 'sbol2:role',
  sbolType: 'sbol2:type'
};

const singleValueFacetClauses = (properties, excludeFacet) =>
  Object.entries(FACET_PREDICATES)
    .filter(([facet]) => excludeFacet !== facet && properties[facet])
    .map(
      ([facet, predicate]) =>
        `?tl ${predicate} ${wrapValue(properties[facet])} .`
    );

const collectionClauses = (properties, excludeFacet) => {
  if (excludeFacet === 'collections' || !properties.collections?.length) {
    return [];
  }
  return properties.collections.map(
    collection => `${wrapValue(collection.value)} sbol2:member ?tl .`
  );
};

const extraFilterClauses = (properties, excludeExtraFilterIndex) =>
  (properties.extraFilters || [])
    .filter(
      (filter, index) =>
        index !== excludeExtraFilterIndex && filter.filter && filter.value
    )
    .map(filter => `?tl ${filter.filter} ${wrapValue(filter.value)} .`);

const textQueryClauses = query => {
  if (!query) {
    return [];
  }
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return words.map(word => {
    const escaped = word.replace(/'/g, "\\'");
    return `FILTER(CONTAINS(LCASE(STR(?tlDisplayId)), '${escaped}') || CONTAINS(LCASE(STR(?tlName)), '${escaped}') || CONTAINS(LCASE(STR(?tlDescription)), '${escaped}'))`;
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
  const clauses = [
    ...singleValueFacetClauses(properties, excludeFacet),
    ...collectionClauses(properties, excludeFacet),
    ...extraFilterClauses(properties, excludeExtraFilterIndex),
    ...textQueryClauses(query)
  ];

  return clauses.join('\n      ');
}
