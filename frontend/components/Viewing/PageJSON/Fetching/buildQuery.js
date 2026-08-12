import compileTableSections from './compileTableSections';
import getId from './getId';
/**
 * Builds a SPARQL query from a tableJSON object
 * @param {*} uri
 * @param {*} tableJSON
 * @returns
 */
export default function buildQuery(uri, tableJSON) {
  if (!tableJSON) {
    return null;
  }
  compileTableSections(tableJSON);
  const rootPredicateDictionary = {};
  rootPredicateDictionary[tableJSON.rootPredicate] = [];
  const additionalSelections = [];
  tableJSON.sections.forEach(column => {
    const root = column.rootPredicateOverride || tableJSON.rootPredicate;
    if (root !== tableJSON.rootPredicate) {
      additionalSelections.push(getId(column));
    }
    if (!rootPredicateDictionary[root]) {
      rootPredicateDictionary[root] = [];
    }
    rootPredicateDictionary[root].push(column);
  });
  const primary = getTableQuery(
    uri,
    rootPredicateDictionary[tableJSON.rootPredicate],
    tableJSON.rootPredicate,
    false,
    additionalSelections
  );
  let queryToReturn = primary.query;
  delete rootPredicateDictionary[tableJSON.rootPredicate];
  for (const [rootPredicate, columns] of Object.entries(
    rootPredicateDictionary
  )) {
    const nested = getTableQuery(uri, columns, rootPredicate, true);
    queryToReturn += `{\n${nested.query}}`;
  }
  const groupBy = primary.groupByVars.length
    ? ` GROUP BY ${primary.groupByVars.join(' ')}`
    : '';
  return (
    queryToReturn +
    `}${groupBy}${tableJSON.orderBy ? ' ORDER BY ' + tableJSON.orderBy : ''}`
  );
}

function getTableQuery(
  uri,
  columns,
  rootPredicate,
  nestedQuery = false,
  additionalSelections = []
) {
  const rootId = getId({ title: rootPredicate });
  const items = [...additionalSelections];
  items.push(rootId);
  const subqueries = [];
  let hasAggregate = false;
  subqueries.push(`{\n<${uri}> ${rootPredicate} ${rootId}`);
  columns.forEach(column => {
    if (!column.predicates && !column.bindTo) {
      return;
    } else if (column.bindTo != null && column.bindToPredicateIndex != null) {
      // Section references another section's variable - reuse it without new OPTIONAL
      const refSection = columns.find(
        c =>
          c.title === column.bindTo ||
          c.title.startsWith(column.bindTo + '__')
      );
      if (refSection && refSection.predicates && refSection.predicates.length > column.bindToPredicateIndex) {
        const predicateIndex = column.bindToPredicateIndex;
        const isLastPredicate = predicateIndex === refSection.predicates.length - 1;
        const boundVariable = isLastPredicate
          ? getId(refSection)
          : getId({ title: refSection.predicates[predicateIndex] });
        items.push(`(${boundVariable} AS ${getId(column)})`);
      }
    } else if (!column.predicates || column.predicates.length === 0) {
      items.push(`(${rootId} AS ${getId(column)})`);
    } else {
      let topLevelId = rootId;
      let groupResults = column.group;
      column.predicates.forEach((predicate, index) => {
        const isLastPredicate = index == column.predicates.length - 1;
        let predicateId = isLastPredicate
          ? getId(column)
          : getId({ title: predicate });
        subqueries.push(`OPTIONAL { ${topLevelId} ${predicate} ${predicateId}`);
        topLevelId = predicateId;
        if (isLastPredicate && groupResults) {
          hasAggregate = true;
          // STR() so IRI values concatenate on sbol-db/Oxigraph; GROUP BY added by caller.
          items.push(
            `(GROUP_CONCAT(DISTINCT STR(${predicateId}); separator=", ") AS ${predicateId})`
          );
        } else {
          items.push(predicateId);
        }
      });
      subqueries.push('}'.repeat(column.predicates.length));
    }
  });
  subqueries.push('}');
  const uniqueItems = [...new Set(items)];
  const groupByVars = hasAggregate
    ? [...new Set(uniqueItems.flatMap(groupByVarsFromSelectItem))]
    : [];
  return {
    query:
      'SELECT\n' +
      uniqueItems.join('\n') +
      `${!nestedQuery ? '\n{' : '\n'}` +
      subqueries.join('\n'),
    groupByVars
  };
}

/**
 * Non-aggregate SELECT items contribute their underlying variable(s) to GROUP BY.
 * Aggregate projections (GROUP_CONCAT) are skipped.
 */
function groupByVarsFromSelectItem(item) {
  if (/GROUP_CONCAT/i.test(item)) {
    return [];
  }
  const asMatch = /^\((.+) AS (.+)\)$/.exec(item.trim());
  if (asMatch) {
    const source = asMatch[1].trim();
    return source.startsWith('?') ? [source] : [];
  }
  return item.startsWith('?') ? [item] : [];
}
