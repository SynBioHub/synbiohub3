export default function getId(section) {
  if (section.id) return `?${section.id}`;
  let titleToParse = section.title;
  if (Array.isArray(section.title)) {
    titleToParse = section.title.join('');
  }
  return `?${titleToParse.replace(/[^A-Z0-9]+/gi, '_').toLowerCase()}`;
}
