export default function compileTableSections(table) {
  // iterate over sections and rename section title if it is the same
  // as title as the section above it
  if (table) {
    let lastSectionTitle = '';
    let sameTitleCount = 1;
    for (let i = 0; i < table.sections.length; i++) {
      if (table.sections[i].title === lastSectionTitle) {
        table.sections[i].title = table.sections[i].title + '__' + sameTitleCount;
        sameTitleCount++;
      } else {
        lastSectionTitle = table.sections[i].title;
        sameTitleCount = 1;
      }
    }
    return table.sections;
  }
  return null;

}
