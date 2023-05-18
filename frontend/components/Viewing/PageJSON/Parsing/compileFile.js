export function compileFile(json) {
  json?.tables?.forEach(table => {
    table.sections?.forEach(section => {
      if (section?.predicates) {
        section.predicates.forEach(predicate => {
          if (predicate.includes('||')) {
            console.log(section, predicate.split('||'));
          }
        });
      }
    });
  });
}
