// Generates every derived file from part_<n>/part.mjs + part_<n>/content/*.mjs:
//   part_<n>/<chapter>/README.md, exercises.sql, solutions.sql, my_answers.sql (only if missing)
//   part_<n>/playground.html (self-contained practice page)
//   index.html (hub: every part + course schedule / exam plan)
// Run with: npm run build            (all parts)
//           npm run build -- --part 2
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { LAB, REPO, CORE_TABLES, setupScripts, loadParts, databaseProvider, partFilter } from './common.mjs';
import { produceTable, runScript } from './engine.mjs';
import { block, inline, plain } from './md.mjs';
import schedule from '../schedule.mjs';

const { filter, rest } = partFilter(process.argv.slice(2));
const allParts = await loadParts(filter);
const buildHub = rest.length === process.argv.slice(2).length; // no --part: rebuild index.html too
const stars = n => '★'.repeat(n) + '☆'.repeat(3 - n);
const LETTERS = 'ABCD';
const template = readFileSync(path.join(LAB, 'tools', 'playground.template.html'), 'utf8');
const engineSource = readFileSync(path.join(LAB, 'tools', 'engine.mjs'), 'utf8').replace(/^export /gm, '');
const fdSource = readFileSync(path.join(LAB, 'tools', 'fd.mjs'), 'utf8').replace(/^export /gm, '');

const sqlComment = text => plain(text).split('\n').map(l => ('-- ' + l).trimEnd()).join('\n');

function exerciseHeader(ch) {
  return `-- =====================================================================
-- CS4420 · ${ch.label} — ${ch.titleVi} (${ch.title})
-- Dialect: PostgreSQL. Database: xem lab/db/*.sql
-- =====================================================================`;
}

function exerciseBlock(ex) {
  const lines = [`-- @ex ${ex.id}  [${ex.topic}]  ${stars(ex.level)}`, sqlComment(ex.prompt)];
  if (ex.hint) lines.push(sqlComment('Gợi ý: ' + ex.hint));
  if (ex.fresh) lines.push('-- (Bài này chạy trên một database mới — được dùng begin/commit/rollback.)');
  if (ex.ordered) lines.push('-- (Thứ tự dòng được chấm.)');
  return lines.join('\n');
}

function writeChapterFiles(part, ch) {
  const dir = path.join(part.dir, ch.slug);
  mkdirSync(dir, { recursive: true });

  const tpl = [
    exerciseHeader(ch),
    `-- Viết câu trả lời ngay dưới mỗi đề (giữ nguyên dòng "-- @ex ...").
-- Chấm tự động (trong thư mục lab/):   npm run grade -- ${ch.key}
-- Bài tự chấm chạy trong một transaction rồi rollback, nên dữ liệu gốc không đổi.
-- Bài có "check" (DDL, insert, update...) được chấm bằng một câu truy vấn kiểm tra sau khi chạy.`,
    ...ch.exercises.map(ex => exerciseBlock(ex) + '\n\n\n'),
  ].join('\n\n');
  writeFileSync(path.join(dir, 'exercises.sql'), tpl);
  if (!existsSync(path.join(dir, 'my_answers.sql'))) writeFileSync(path.join(dir, 'my_answers.sql'), tpl);

  const solutions = [
    exerciseHeader(ch),
    `-- ĐÁP ÁN. Hãy tự làm trước khi xem!
-- Mỗi bài độc lập với nhau: chạy TỪNG bài (bôi đen rồi chạy). Chạy cả file một lần
-- sẽ thay đổi dữ liệu và tạo trùng tên object. Muốn về dữ liệu gốc: chạy lại lab/db/*.sql.`,
    ...ch.exercises.map(ex => {
      let s = exerciseBlock(ex) + '\n' + ex.solution.trim();
      if (ex.check) s += '\n\n-- Câu truy vấn hệ thống dùng để chấm:\n' + ex.check.trim().split('\n').map(l => '--   ' + l).join('\n');
      return s;
    }),
  ].join('\n\n') + '\n';
  writeFileSync(path.join(dir, 'solutions.sql'), solutions);

  const md = [];
  md.push(`# ${ch.label} — ${ch.titleVi}`);
  md.push(`*${ch.title}${ch.source ? ` · ${ch.source}` : ' · Database System Concepts, 7th Ed.'}*`);
  md.push(`> **Cách học:** đọc *Tóm tắt kiến thức* → làm *Trắc nghiệm* → trả lời *Câu hỏi tự luận* → làm *Bài tập SQL* trong [\`playground.html\`](../playground.html) hoặc [\`my_answers.sql\`](my_answers.sql) (chấm trong thư mục \`lab/\` bằng \`npm run grade -- ${ch.key}\`). Đáp án SQL: [\`solutions.sql\`](solutions.sql).`);
  md.push('## 1. Tóm tắt kiến thức');
  md.push(ch.summary.trim());
  md.push(`## 2. Trắc nghiệm (${ch.quiz.length} câu)`);
  ch.quiz.forEach((q, i) => {
    md.push(`**Câu ${i + 1}.** ${q.q}\n\n` + q.options.map((o, j) => `- ${LETTERS[j]}. ${o}`).join('\n') +
      `\n\n<details><summary>Đáp án</summary>\n\n**${LETTERS[q.answer]}** — ${q.explain}\n\n</details>`);
  });
  md.push(`## 3. Câu hỏi tự luận (${ch.questions.length} câu)`);
  ch.questions.forEach((q, i) => {
    md.push(`**Câu ${i + 1}.** ${q.q}\n\n<details><summary>Gợi ý đáp án</summary>\n\n${q.answer}\n\n</details>`);
  });
  md.push(`## 4. Bài tập SQL (${ch.exercises.length} bài)`);
  md.push('| # | Chủ đề | Mức | Đề bài |\n|---|---|---|---|\n' +
    ch.exercises.map(ex => `| ${ex.id} | ${ex.topic} | ${stars(ex.level)} | ${plain(ex.prompt).replace(/\n/g, ' ').replace(/\|/g, '\\|')} |`).join('\n'));
  writeFileSync(path.join(dir, 'README.md'), md.join('\n\n') + '\n');
}

// Tables and columns of the part's database, split into the part's display groups.
async function schemaOf(part, db) {
  const [colRes] = await runScript(db, `
    select c.table_name, c.column_name, c.data_type,
           coalesce(c.character_maximum_length::text, c.numeric_precision::text || ',' || c.numeric_scale::text, '') as size,
           exists (select 1 from information_schema.key_column_usage k
                   join information_schema.table_constraints t on t.constraint_name = k.constraint_name
                   where t.constraint_type = 'PRIMARY KEY' and k.table_name = c.table_name
                     and k.column_name = c.column_name) as pk
    from information_schema.columns c
    join information_schema.tables t on t.table_name = c.table_name and t.table_schema = c.table_schema
    where c.table_schema = 'public' and t.table_type = 'BASE TABLE'
    order by c.table_name, c.ordinal_position;`);
  const columns = {};
  for (const [table, column, type, size, pk] of colRes.rows) {
    (columns[table] ||= []).push({ column, type: size ? `${type}(${size.replace(/,$/, '')})` : type, pk });
  }
  const taken = new Set();
  const groups = (part.schemaGroups || [{ title: 'University database (theo sách)', core: true }, { title: 'Bảng phụ' }]).map(g => {
    const byPrefix = g.prefix ? Object.keys(columns).sort().filter(t => [].concat(g.prefix).some(x => t.startsWith(x))) : [];
    const tables = (g.core ? CORE_TABLES : [...(g.tables || []), ...byPrefix]).filter(t => columns[t] && !taken.has(t));
    tables.forEach(t => taken.add(t));
    return { ...g, tables };
  });
  const rest = Object.keys(columns).filter(t => !taken.has(t)).sort();
  const catchAll = groups.find(g => !g.core && !g.prefix && !g.tables.length);
  if (catchAll) catchAll.tables = rest;
  else if (rest.length) groups.push({ title: 'Bảng khác', tables: rest });
  return groups.filter(g => g.tables.length).map(g => ({
    title: g.title, note: g.note || '', core: !!g.core,
    tables: g.tables.map(t => ({ table: t, columns: columns[t] })),
  }));
}

const partLink = p => ({ number: p.number, slug: p.slug, title: p.title, short: `Part ${p.number}` });

let built = 0, total = 0;
for (const part of allParts.filter(filter)) {
  const getDb = await databaseProvider(part.setup);
  const expected = {};
  for (const ch of part.chapters) {
    for (const ex of ch.exercises) expected[ex.id] = await produceTable(await getDb(ex.fresh), ex.solution, ex.check, ex.fresh);
    writeChapterFiles(part, ch);
  }

  const data = {
    part: {
      number: part.number, title: part.title, subtitle: part.subtitle || '', lead: part.lead || '',
      unit: part.unit, storage: part.storage, fdTool: !!part.fdTool, weeks: part.weeks || '',
    },
    parts: allParts.map(partLink),
    setup: setupScripts(part.setup),
    setupFiles: part.setup.map(f => 'lab/db/' + f),
    schemaGroups: await schemaOf(part, await getDb(false)),
    chapters: part.chapters.map(ch => ({
      key: ch.key, store: ch.store, short: ch.short, label: ch.label, navLabel: ch.navLabel, kind: ch.kind,
      title: ch.title,
      titleVi: ch.titleVi,
      summary: block(ch.summary),
      quiz: ch.quiz.map(q => ({ q: inline(q.q), options: q.options.map(inline), answer: q.answer, explain: inline(q.explain) })),
      questions: ch.questions.map(q => ({ q: inline(q.q), answer: block(q.answer) })),
      exercises: ch.exercises.map(ex => ({
        id: ex.id, topic: ex.topic, level: ex.level,
        prompt: block(ex.prompt), hint: ex.hint ? inline(ex.hint) : '',
        solution: ex.solution.trim(), check: ex.check ? ex.check.trim() : null,
        ordered: !!ex.ordered, fresh: !!ex.fresh,
        expected: expected[ex.id],
      })),
    })),
  };

  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  const html = template
    .replace('/*__ENGINE__*/', () => engineSource + '\n' + fdSource)
    .replace('"__DATA__"', () => json)
    .replace('<title>CS4420 Practice Lab</title>', () => `<title>CS4420 · ${part.title}</title>`);
  writeFileSync(path.join(part.dir, 'playground.html'), html);
  const n = part.chapters.reduce((k, c) => k + c.exercises.length, 0);
  built++; total += n;
  console.log(`${part.slug}: ${part.chapters.length} sections, ${n} exercises -> playground.html (${Math.round(html.length / 1024)} KB)`);
}

// ---------------------------------------------------------------- hub (index.html)
if (!buildHub) { console.log(`Built ${built} part(s), ${total} exercises (index.html not rebuilt: run without --part)`); process.exit(0); }
const css = template.match(/<style>[\s\S]*?<\/style>/)[0];
const escHtml = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const chapterOf = (n, key) => {
  const p = allParts.find(x => x.number === n);
  const c = p && p.chapters.find(x => x.key === key);
  return p && c ? { p, c } : null;
};
const examBadge = { midterm: '<span class="lx-badge lx-badge--warning">Thi giữa kỳ</span>', final: '<span class="lx-badge lx-badge--danger">Thi cuối kỳ</span>' };
const rows = schedule.map(w => {
  const links = (w.links || []).map(([n, key]) => chapterOf(n, key)).filter(Boolean)
    .map(({ p, c }) => `<a class="lx-tag" href="${p.slug}/playground.html#/${c.key}/summary" title="${escHtml(c.titleVi)}">P${p.number} · ${escHtml(c.navLabel)}</a>`).join(' ');
  return `<tr${w.exam ? ' class="hub-exam"' : ''}><td class="r">${w.week}</td><td><div class="lx-cell__main">${escHtml(w.content)}</div>${w.note ? `<div class="lx-cell__sub">${escHtml(w.note)}</div>` : ''}</td>
    <td>${w.exam ? examBadge[w.exam] : ''}</td><td class="hub-links">${links}</td></tr>`;
}).join('');
const cards = allParts.map(p => {
  const n = p.chapters.reduce((k, c) => k + c.exercises.length, 0);
  const q = p.chapters.reduce((k, c) => k + c.quiz.length, 0);
  return `<div class="lx-card hub-part">
    <div class="lx-card__head"><div><div class="lx-eyebrow">Part ${p.number}${p.weeks ? ` · ${escHtml(p.weeks)}` : ''}</div><h2 class="lx-h2">${escHtml(p.title)}</h2></div>
      <a class="lx-btn lx-btn--primary" href="${p.slug}/playground.html">Mở</a></div>
    <div class="lx-card__body lx-prose"><p>${escHtml(p.subtitle || '')}</p><ul>${p.chapters.map(c => `<li><a href="${p.slug}/playground.html#/${c.key}/summary">${escHtml(c.label)}</a> — ${escHtml(c.titleVi)}</li>`).join('')}</ul></div>
    <div class="lx-card__foot"><span>${n} bài SQL tự chấm · ${q} câu trắc nghiệm</span><a href="${p.slug}/README.md">README</a></div>
  </div>`;
}).join('');
const hub = `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>CS4420 Practice Lab</title>
${css}
<style>
  .hub-parts { display: grid; gap: var(--space-4); grid-template-columns: repeat(auto-fill, minmax(min(340px, 100%), 1fr)); }
  .hub-part .lx-card__body { flex: 1; }
  .hub-part { display: flex; flex-direction: column; }
  .hub-links { display: flex; flex-wrap: wrap; gap: 4px; }
  .hub-links a { text-decoration: none; }
  tr.hub-exam td { background: var(--surface-sunken); font-weight: 600; }
</style>
</head>
<body>
<header class="lx-topnav"><a class="lx-logo" href="index.html">CS4420 <span>Practice Lab</span></a>
  <nav class="lx-nav" aria-label="Các part">${allParts.map(p => `<a href="${p.slug}/playground.html" title="${escHtml(p.title)}">Part ${p.number}</a>`).join('')}</nav></header>
<main class="lx-page">
  <div class="lx-head"><div class="lx-head__text"><div class="lx-eyebrow">CS4420 · Database Systems · Database System Concepts, 7th Ed.</div>
    <h1 class="lx-h1">Bộ luyện tập theo lịch học</h1>
    <p class="lx-lead">Bốn part: học theo chương (Part 1, 2) và ôn thi (Part 3 giữa kỳ, Part 4 cuối kỳ). Phần ôn thi bám sát <strong>Practice Exercises</strong> của sách — đề thi chủ yếu lấy từ đây. Mọi câu SQL chạy trên PostgreSQL ngay trong trình duyệt.</p></div></div>
  <div class="hub-parts">${cards}</div>
  <div class="lx-card">
    <div class="lx-card__head"><h2 class="lx-h2">Lịch học &amp; kế hoạch thi</h2><span class="lx-subtle" style="font-size:12px">Bấm nhãn để mở đúng phần luyện tập</span></div>
    <div class="lx-scroll"><table class="lx-table"><thead><tr><th class="r">Tuần</th><th>Nội dung</th><th>Thi</th><th>Luyện tập</th></tr></thead><tbody>${rows}</tbody></table></div>
  </div>
</main>
</body>
</html>
`;
writeFileSync(path.join(REPO, 'index.html'), hub);
console.log(`Built ${built} part(s), ${total} exercises; hub -> index.html`);
process.exit(0);
