export default function createRenderingObject(column, value, titleToValueMap) {
  let text = column.text ? loadText(column.text, titleToValueMap) : value;
  if (column.stripAfter) {
    text = text.slice(text.lastIndexOf(column.stripAfter) + 1);
  }
  const link = column.link ? loadText(column.link, titleToValueMap) : undefined;
  const linkType = column.linkType || 'default';
  const infoLink = column.infoLink
    ? loadText(column.infoLink, titleToValueMap)
    : 'NA';
  return {
    text,
    link,
    linkType,
    infoLink,
    grouped: column.group ? true : false,
    hidden: column.hide ? true : false,
    tableIcon: column.tableIcon,
    icon: column.icon,
    id: column.key
  };
}

function loadText(template, args) {
  for (const key of Object.keys(args)) {
    template = template.replace(
      new RegExp(`\\$<${key}>`, 'g'),
      args[key].value
    );
  }

  return template;
}
