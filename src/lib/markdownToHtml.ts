/**
 * Converts a Markdown string to an HTML string.
 * Used exclusively by ProseRenderer — the single conversion point for unit body content.
 *
 * Handles: headings (h1–h3), bold, italic, inline code, paragraphs,
 * unordered lists (consecutive `-` lines), and pipe tables.
 */
export function markdownToHtml(md: string): string {
  const lines = md.split('\n');
  const output: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Heading
    const h3 = line.match(/^### (.+)/);
    const h2 = line.match(/^## (.+)/);
    const h1 = line.match(/^# (.+)/);
    if (h3) { output.push(`<h3>${inlineFormat(h3[1])}</h3>`); i++; continue; }
    if (h2) { output.push(`<h2>${inlineFormat(h2[1])}</h2>`); i++; continue; }
    if (h1) { output.push(`<h1>${inlineFormat(h1[1])}</h1>`); i++; continue; }

    // Pipe table — collect consecutive `|` lines
    if (line.trimStart().startsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trimStart().startsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      output.push(buildTable(tableLines));
      continue;
    }

    // Unordered list — collect consecutive `- ` lines
    if (line.match(/^- /)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^- /)) {
        items.push(`<li>${inlineFormat(lines[i].replace(/^- /, ''))}</li>`);
        i++;
      }
      output.push(`<ul>${items.join('')}</ul>`);
      continue;
    }

    // Blank line — skip (paragraph separator handled by chunk joining below)
    if (line.trim() === '') { i++; continue; }

    // Regular paragraph line — collect until blank or structural line
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].match(/^#{1,3} /) &&
      !lines[i].match(/^- /) &&
      !lines[i].trimStart().startsWith('|')
    ) {
      paraLines.push(inlineFormat(lines[i]));
      i++;
    }
    if (paraLines.length > 0) {
      output.push(`<p>${paraLines.join(' ')}</p>`);
    }
  }

  return output.join('\n');
}

/** Apply bold, italic, and inline code formatting to a single line of text. */
function inlineFormat(text: string): string {
  return text
    // Bold before italic so **text** doesn't get partially matched
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}

/** Convert an array of pipe-table lines into an HTML table string. */
function buildTable(lines: string[]): string {
  const rows = lines.map((l) =>
    l
      .split('|')
      .slice(1, -1)
      .map((cell) => cell.trim())
  );

  if (rows.length === 0) return '';

  // Detect separator row (---|---) and treat preceding row as header
  const sepIdx = rows.findIndex((r) => r.every((c) => /^[-:]+$/.test(c)));
  let thead = '';
  let tbodyRows: string[][];

  if (sepIdx === 1) {
    thead = `<thead><tr>${rows[0].map((c) => `<th>${inlineFormat(c)}</th>`).join('')}</tr></thead>`;
    tbodyRows = rows.slice(2);
  } else {
    tbodyRows = rows;
  }

  const tbody = `<tbody>${tbodyRows
    .map((r) => `<tr>${r.map((c) => `<td>${inlineFormat(c)}</td>`).join('')}</tr>`)
    .join('')}</tbody>`;

  return `<table>${thead}${tbody}</table>`;
}
