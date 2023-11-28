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
    return [sequence]; // Return the original sequence wrapped in an array if it's not valid
  }
  
  const chunkSize = 10;
  const lineLength = 50;
  let lines = [];
  let currentLine = '';

  for (let i = 0; i < sequence.length; i += chunkSize) {
    // Add line index at the start of each line
    if (i % lineLength === 0) {
      if (i !== 0) {
        lines.push(currentLine);
        currentLine = '';
      }
      currentLine += String(i + 1).padStart(4, '0') + ' ';
    }

    // Add a chunk of the sequence
    currentLine += sequence.slice(i, i + chunkSize);

    // Add a space to separate chunks, but not at the end of a line
    if ((i + chunkSize) % lineLength !== 0) {
      currentLine += ' ';
    }
  }

  // Add the final line if it's not empty
  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}





function isValidSequence(sequence) {
  // This regex checks if the sequence consists only of a, c, t, g, and u characters (case-insensitive)
  return /^[actgu]+$/i.test(sequence);
}