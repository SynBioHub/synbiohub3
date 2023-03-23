import getId from './getId';

function constructObjectForRendering(table, section, value, result, prefixes) {
  return {
    section,
    value,
    table,
    prefixes,
    result
  };
}

export function parseQueryResult2(table, results, prefixes) {
  const rows = results.map(result => {
    const processedSection = {};
    let currentSectionId = '';
    table.sections.forEach(section => {
      const sectionGroup = processedSection[currentSectionId];
      if (
        sectionGroup &&
        section.title === `${currentSectionId}__${sectionGroup.length}`
      )
        sectionGroup.push(
          constructObjectForRendering(
            table,
            section,
            result[`${currentSectionId}_${sectionGroup.length}`],
            result,
            prefixes
          )
        );
      else {
        currentSectionId = getId(section).substring(1);
        processedSection[currentSectionId] = [
          constructObjectForRendering(
            table,
            section,
            result[currentSectionId],
            result,
            prefixes
          )
        ];
      }
    });
    return processedSection;
  });
  return rows;
}

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
  // ids = ids.filter(
  //   (value, index, self) => index === self.findIndex(t => t.id === value.id)
  // );
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
        let externalText = null;
        if (!text) {
          externalText = getStackTrace(table, column.index, row, prefixes);
        }
        let externalLink = null;
        if (!link && column.link) {
          const linkColumnName = parseIdOfLink(column.link);
          if (linkColumnName) {
            const linkColumn = ids.find(id => id.title === linkColumnName);
            if (linkColumn) {
              externalLink = getStackTrace(
                table,
                linkColumn.index,
                row,
                prefixes,
                true
              );
            }
          }
        }
        return {
          text,
          link,
          linkType,
          infoLink,
          grouped,
          externalText,
          externalLink,
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

function getStackTrace(
  table,
  sectionIndex,
  results,
  prefixes,
  showHides = false
) {
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

function parseIdOfLink(link) {
  const index = link.indexOf('$<');
  if (index === -1) return null;
  const endIndex = link.indexOf('>', index);
  if (endIndex === -1) return null;
  return link.substring(index + 2, endIndex);
}

function loadText(template, args) {
  for (const key of Object.keys(args)) {
    template = template.replace(new RegExp(`\\$<${key}>`, 'g'), args[key]);
  }

  return template;
}
