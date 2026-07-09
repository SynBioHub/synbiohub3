const wrapValue = value =>
  value.startsWith('http') ? `<${value}>` : `'${value.replace(/'/g, "\\'")}'`;

// builds the extra WHERE-clause constraints for a facet query, so that
// selecting a value in one facet narrows the options shown in the others.
export default function buildFacetConstraints(properties, query, excludeFacet) {
  const clauses = [];

  if (excludeFacet !== 'creator' && properties.creator) {
    clauses.push(`?tl dc:creator ${wrapValue(properties.creator)} .`);
  }
  if (excludeFacet !== 'objectType' && properties.objectType) {
    clauses.push(`?tl a ${wrapValue(properties.objectType)} .`);
  }
  if (excludeFacet !== 'role' && properties.role) {
    clauses.push(`?tl sbol2:role ${wrapValue(properties.role)} .`);
  }
  if (excludeFacet !== 'sbolType' && properties.sbolType) {
    clauses.push(`?tl sbol2:type ${wrapValue(properties.sbolType)} .`);
  }
  if (
    excludeFacet !== 'collections' &&
    properties.collections &&
    properties.collections.length > 0
  ) {
    for (const collection of properties.collections) {
      clauses.push(`${wrapValue(collection.value)} sbol2:member ?tl .`);
    }
  }
  for (const filter of properties.extraFilters || []) {
    if (filter.filter && filter.value) {
      clauses.push(`?tl ${filter.filter} ${wrapValue(filter.value)} .`);
    }
  }
  if (query) {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    for (const word of words) {
      const escaped = word.replace(/'/g, "\\'");
      clauses.push(
        `FILTER(CONTAINS(LCASE(STR(?tlDisplayId)), '${escaped}') || CONTAINS(LCASE(STR(?tlName)), '${escaped}') || CONTAINS(LCASE(STR(?tlDescription)), '${escaped}'))`
      );
    }
  }

  return clauses.join('\n      ');
}
