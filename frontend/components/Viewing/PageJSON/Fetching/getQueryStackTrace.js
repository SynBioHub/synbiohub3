import getId from './getId';

export default function getQueryStackTrace(
  table,
  section,
  results,
  prefixes,
  showHides = false
) {
  if (!section.predicates) return null;
  // start at rootPredicate, then go down predicate tree until no result
  const currRootPredicate =
    section.rootPredicateOverride || table.rootPredicate;
  let failedAtPredicate = getId({ title: currRootPredicate }).substring(1);
  for (let i = 0; i < section.predicates.length; i++) {
    const nextPredicate = getId({ title: section.predicates[i] }).substring(1);
    if (!results[nextPredicate]) {
      const newSection = {
        ...section,
        predicates: section.predicates.slice(i + 1),
        rootPredicateOverride: null,
        hide: showHides ? false : section.hide
      };
      return {
        uri: results[failedAtPredicate],
        table: {
          ...table,
          rootPredicate: section.predicates[i],
          sections: [newSection]
        },
        prefixes
      };
    }
    failedAtPredicate = nextPredicate;
  }
  return null;
}
