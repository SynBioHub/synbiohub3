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
  let queryToReturn = getTableQuery(
    uri,
    rootPredicateDictionary[tableJSON.rootPredicate],
    tableJSON.rootPredicate,
    false,
    additionalSelections
  );
  delete rootPredicateDictionary[tableJSON.rootPredicate];
  for (const [rootPredicate, columns] of Object.entries(
    rootPredicateDictionary
  )) {
    queryToReturn += `{\n${getTableQuery(uri, columns, rootPredicate, true)}}`;
  }
  return (
    queryToReturn +
    `} ${tableJSON.orderBy ? 'ORDER BY ' + tableJSON.orderBy : ''}`
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
  subqueries.push(`{\n<${uri}> ${rootPredicate} ${rootId}`);
  columns.forEach(column => {
    if (!column.predicates) {
      return;
    } else if (column.predicates.length === 0) {
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
          items.push(
            `(group_concat(${predicateId}; separator=", ") AS ${predicateId})`
          );
        } else {
          items.push(predicateId);
        }
      });
      subqueries.push('}'.repeat(column.predicates.length));
    }
  });
  subqueries.push('}');
  return (
    'SELECT\n' +
    [...new Set(items)].join('\n') +
    `${!nestedQuery ? '\n{' : '\n'}` +
    subqueries.join('\n')
  );
}
