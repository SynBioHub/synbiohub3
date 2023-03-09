import getId from './getId';

export default function parseQueryResult(table, items, prefixes) {
  let ids = table.sections.map((column, index) => {
    return {
      title: column.title,
      id: getId(column).substring(1),
      link: column.link,
      stripAfter: column.stripAfter,
      linkType: column.linkType,
      infoLink: column.infoLink,
      text: column.text,
      index: index,
      hidden: column.hide ? true : false,
      grouped: column.group ? true : false,
      tableIcon: table.icon,
      icon: column.icon
    };
  });

  ids = ids.filter(
    (value, index, self) => index === self.findIndex(t => t.id === value.id)
  );
  let content = items.map(row => {
    const titleToValueMap = {};
    ids.forEach(id => {
      titleToValueMap[id.title] = row[id.id];
    });
    return ids
      .map(column => {
        if (column.hidden) return;
        let text = column.text
          ? loadText(column.text, titleToValueMap)
          : row[column.id];
        if (column.stripAfter) {
          text = text.slice(text.lastIndexOf(column.stripAfter) + 1);
        }
        const link = column.link
          ? loadText(column.link, titleToValueMap)
          : undefined;
        const linkType = column.linkType || 'default';
        const infoLink = column.infoLink
          ? loadText(column.infoLink, titleToValueMap)
          : 'NA';
        const grouped = column.grouped;
        let externalFetch = null;
        if (!text) {
          externalFetch = getStackTrace(table, column.index, row, prefixes);
        }
        return {
          text,
          link,
          linkType,
          infoLink,
          grouped,
          externalFetch,
          sectionIndex: column.index,
          tableIcon: column.tableIcon,
          icon: column.icon,
          id: column.id
        };
      })
      .filter(column => column !== undefined);
  });
  return content;
}

function getStackTrace(table, sectionIndex, results, prefixes) {
  const section = table.sections[sectionIndex];
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
        rootPredicateOverride: null
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

function loadText(template, args) {
  for (const key of Object.keys(args)) {
    template = template.replace(new RegExp(`\\$<${key}>`, 'g'), args[key]);
  }

  return template;
}
