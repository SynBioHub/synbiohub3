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

export default function parseQueryResult(table, results, prefixes) {
  if (!results){
    return null;
  }
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
