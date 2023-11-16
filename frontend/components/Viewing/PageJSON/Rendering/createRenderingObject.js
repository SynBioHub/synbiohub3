export default function createRenderingObject(column, value, titleToValueMap) {
  let text = column.text ? loadText(column.text, titleToValueMap) : value;
  if (column.stripAfter) {
    const parts = text.split('/');
    if (parts.length >= 2) {
      const lastPart = parts[parts.length - 1];

      if (/^1(\.0+)*$/.test(lastPart)) {
        text = parts[parts.length - 2];
      } else {
        const delimiters = ['#', '%', '/'];
        const lastPartSegments = lastPart.split(new RegExp(`[${delimiters.join('')}]`));

        text = lastPartSegments.pop();
      }
    }
  }
  if (column.title === 'Sequence') {
    text = formatSequence(text);
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
    if (!args[key]) console.log(key, args[key]);
    template = template.replace(
      new RegExp(`\\$<${key}>`, 'g'),
      args[key].value
    );
  }

  return template;
}

function formatSequence(sequence) {
  if (!isValidSequence(sequence)) {
    return sequence; // Return the original sequence if it's not valid
  }
  const chunkSize = 10;
  const chunksPerLine = 5;
  let result = '';

  for (let i = 0; i < sequence.length; i += chunkSize * chunksPerLine) {
    const lineStart = i;
    const lineEnd = i + chunkSize * chunksPerLine;
    const line = sequence.slice(lineStart, lineEnd);

    for (let j = 0; j < line.length; j += chunkSize) {
      const chunkStart = j;
      const chunkEnd = j + chunkSize;
      const chunk = line.slice(chunkStart, chunkEnd);
      result += chunk + ' ';
    }

    const lineNumber = String(lineStart + 1).padStart(4, '0');
    result = lineNumber + ' ' + result.trim() + '\n';
  }

  return result.trim();
}

function isValidSequence(sequence) {
  // This regex checks if the sequence consists only of a, c, t, g, and u characters (case-insensitive)
  return /^[actgu]+$/i.test(sequence);
}