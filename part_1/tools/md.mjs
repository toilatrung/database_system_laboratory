// Minimal Markdown -> HTML for the content files (headings, paragraphs,
// lists, tables, fenced code, inline code/bold/italic). Raw HTML such as
// <sub> passes through untouched.

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function inline(text) {
  const parts = String(text).split(/(`[^`]+`)/g);
  return parts.map(p => {
    if (/^`[^`]+`$/.test(p)) return `<code>${esc(p.slice(1, -1))}</code>`;
    return p
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*\w])\*(?!\s)(.+?)\*(?!\w)/g, '$1<em>$2</em>')
      .replace(/\n/g, '<br>');
  }).join('');
}

export function block(md) {
  const lines = String(md).replace(/\r/g, '').split('\n');
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const code = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) code.push(lines[i++]);
      i++;
      out.push(`<pre class="code" data-lang="${lang}"><code>${esc(code.join('\n'))}</code></pre>`);
      continue;
    }
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) { out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`); i++; continue; }
    if (line.startsWith('|')) {
      const rows = [];
      while (i < lines.length && lines[i].startsWith('|')) rows.push(lines[i++]);
      const cells = r => r.replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map(c => c.trim());
      const head = cells(rows[0]);
      const body = rows.slice(2).map(cells);
      out.push('<div class="table-scroll"><table><thead><tr>' + head.map(c => `<th>${inline(c)}</th>`).join('') +
        '</tr></thead><tbody>' + body.map(r => '<tr>' + r.map(c => `<td>${inline(c)}</td>`).join('') + '</tr>').join('') +
        '</tbody></table></div>');
      continue;
    }
    if (/^\s*(-|\d+\.)\s/.test(line)) {
      const ordered = /^\s*\d+\./.test(line);
      const items = [];
      while (i < lines.length && /^\s*(-|\d+\.)\s/.test(lines[i])) {
        let item = lines[i++].replace(/^\s*(-|\d+\.)\s/, '');
        while (i < lines.length && /^\s{2,}\S/.test(lines[i]) && !/^\s*(-|\d+\.)\s/.test(lines[i])) item += ' ' + lines[i++].trim();
        items.push(`<li>${inline(item)}</li>`);
      }
      out.push(ordered ? `<ol>${items.join('')}</ol>` : `<ul>${items.join('')}</ul>`);
      continue;
    }
    const para = [];
    while (i < lines.length && lines[i].trim() && !/^(```|#|\||\s*(-|\d+\.)\s)/.test(lines[i])) para.push(lines[i++]);
    out.push(`<p>${inline(para.join('\n'))}</p>`);
  }
  return out.join('\n');
}

// Plain text for SQL comments: drop markdown/HTML decoration.
export function plain(text) {
  return String(text)
    .replace(/<sub>(.*?)<\/sub>/g, '[$1]')
    .replace(/<[^>]+>/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}
