export function parseTableHeaders(sections) {
  const headers = [];
  sections?.forEach(section => {
    section.title = section.title?.split('__')[0];
    if (!headers.includes(section) && section) {
      headers.push(section);
    }
  });

  return headers;
}
