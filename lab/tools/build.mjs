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
const allParts = await loadParts(); // every part: the sidebar lists them all
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
  const lines = [`-- @ex ${ex.id}  [${ex.topic}]  ${stars(ex.level)}`];
  if (ex.en) lines.push(sqlComment('Đề gốc: ' + ex.en.trim()), '--');
  lines.push(sqlComment(ex.prompt));
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

  const LABELS = { summary: 'Tóm tắt kiến thức', quiz: 'Trắc nghiệm', questions: 'Câu hỏi tự luận', ex: 'Bài tập SQL', ...(part.stepLabels || {}) };
  const steps = (part.steps || ['summary', 'quiz', 'questions', 'ex']).filter(k => k !== 'quiz' || ch.quiz.length);
  const section = {
    summary: () => [ch.summary.trim()],
    quiz: () => ch.quiz.map((q, i) => `**Câu ${i + 1}.** ${q.q}\n\n` + q.options.map((o, j) => `- ${LETTERS[j]}. ${o}`).join('\n') +
      `\n\n<details><summary>Đáp án</summary>\n\n**${LETTERS[q.answer]}** — ${q.explain}\n\n</details>`),
    questions: () => ch.questions.map((q, i) => `**Câu ${i + 1}.** ${q.en ? `\n\n> ${q.en.trim().replace(/\n/g, '\n> ')}\n\n` : ''}${q.q}\n\n<details><summary>Gợi ý đáp án</summary>\n\n${q.answer}\n\n</details>`),
    ex: () => ['| # | Chủ đề | Mức | Đề bài |\n|---|---|---|---|\n' +
      ch.exercises.map(ex => `| ${ex.id} | ${ex.topic} | ${stars(ex.level)} | ${[ex.en ? `${plain(ex.en)}` : '', plain(ex.prompt)].filter(Boolean).join('<br>').replace(/\n/g, ' ').replace(/\|/g, '\\|')} |`).join('\n')],
  };
  const count = { summary: '', quiz: ` (${ch.quiz.length} câu)`, questions: ` (${ch.questions.length} câu)`, ex: ` (${ch.exercises.length} bài)` };
  const md = [];
  md.push(`# ${ch.label} — ${ch.titleVi}`);
  md.push(`*${ch.title}${ch.source ? ` · ${ch.source}` : ' · Database System Concepts, 7th Ed.'}*`);
  md.push(`> **Cách học:** ${steps.map(k => `*${LABELS[k]}*`).join(' → ')}, trong [\`playground.html\`](../playground.html) hoặc [\`my_answers.sql\`](my_answers.sql) (chấm trong thư mục \`lab/\` bằng \`npm run grade -- ${ch.key}\`). Đáp án SQL: [\`solutions.sql\`](solutions.sql).`);
  steps.forEach((k, n) => { md.push(`## ${n + 1}. ${LABELS[k]}${count[k]}`); md.push(...section[k]()); });
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

const partLink = p => ({
  number: p.number, slug: p.slug, title: p.title, short: p.short, label: p.label, group: p.group, review: p.review, weeks: p.weeks || '',
  chapters: p.chapters.map(c => ({ key: c.key, navLabel: c.navLabel, label: c.label, titleVi: c.titleVi })),
});

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
      number: part.number, slug: part.slug, short: part.short, label: part.label, group: part.group, review: part.review, title: part.title, subtitle: part.subtitle || '', lead: part.lead || '',
      unit: part.unit, storage: part.storage, fdTool: !!part.fdTool, weeks: part.weeks || '',
      steps: part.steps || null, stepLabels: part.stepLabels || {},
    },
    parts: allParts.map(partLink),
    schedule: schedule.map(w => ({ week: w.week, content: w.content, note: w.note || '', exam: w.exam || '', parts: [...new Set((w.links || []).map(l => l[0]))] })),
    setup: setupScripts(part.setup),
    setupFiles: part.setup.map(f => 'lab/db/' + f),
    schemaGroups: await schemaOf(part, await getDb(false)),
    chapters: part.chapters.map(ch => ({
      key: ch.key, store: ch.store, short: ch.short, label: ch.label, navLabel: ch.navLabel, kind: ch.kind,
      title: ch.title,
      titleVi: ch.titleVi,
      summary: block(ch.summary),
      quiz: ch.quiz.map(q => ({ q: inline(q.q), options: q.options.map(inline), answer: q.answer, explain: inline(q.explain) })),
      questions: ch.questions.map(q => ({ q: inline(q.q), en: q.en ? block(q.en) : '', answer: block(q.answer) })),
      exercises: ch.exercises.map(ex => ({
        id: ex.id, topic: ex.topic, level: ex.level,
        prompt: block(ex.prompt), en: ex.en ? block(ex.en) : '', hint: ex.hint ? inline(ex.hint) : '',
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
// The hub shares the template's fonts, styles and mark. Its data (every part's
// exercise IDs and storage prefix, the schedule with resolved links) is embedded
// as JSON and rendered in the browser, so progress saved by each part shows here.
if (!buildHub) { console.log(`Built ${built} part(s), ${total} exercises (index.html not rebuilt: run without --part)`); process.exit(0); }
// Fonts plus the theme script (it sits between the font links and <style>).
const fonts = template.slice(template.indexOf('<link rel="preconnect"'), template.indexOf('<style>'));
const css = template.match(/<style>[\s\S]*?<\/style>/)[0];
const brandSvg = template.match(/<span class="lx-brand__mark">(<svg[\s\S]*?<\/svg>)<\/span>/)[1];
const themeBtn = template.match(/<button class="lx-iconbtn lx-theme"[\s\S]*?<\/button>/)[0];
const syncBtn = template.match(/<button class="lx-iconbtn lx-sync[\s\S]*?<\/button>/)[0];
const escHtml = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const groupOf = p => p.group || (p.review ? 'exam' : /^part_\d+$/.test(p.slug) ? 'book' : 'exam');
const labelOf = p => p.label || p.short || `Part ${p.number}`;
const titleOf = p => String(p.title || '').replace(/^Part \d+\s*[—-]\s*/, '');
const keyOf = p => (groupOf(p) === 'book' ? `P${p.number}` : ({ midterm: 'GK', final: 'CK' })[p.slug] || labelOf(p).slice(0, 3));
// Schedule links are [slug, chapter] (older schedules used the part number).
const chapterOf = (ref, key) => {
  const p = allParts.find(x => x.slug === ref) || allParts.find(x => x.number === ref && groupOf(x) === 'book');
  const c = p && p.chapters.find(x => x.key === key);
  return p && c ? { p, c } : null;
};
const hubParts = allParts.filter(p => p.chapters.length);
const hubData = {
  parts: hubParts.map(p => ({
    slug: p.slug, key: keyOf(p), label: labelOf(p), title: titleOf(p), subtitle: p.subtitle || '', weeks: p.weeks || '',
    group: groupOf(p), storage: p.storage,
    chapters: p.chapters.map(c => ({ key: c.key, nav: c.navLabel, title: c.titleVi, store: c.store, essays: c.questions.length, ex: c.exercises.map(e => [e.id, e.topic]) })),
  })),
  schedule: schedule.map(w => ({
    week: w.week, content: w.content, note: w.note || '', exam: w.exam || '',
    links: (w.links || []).map(([ref, key]) => chapterOf(ref, key)).filter(Boolean).map(({ p, c }) => ({ slug: p.slug, key: c.key })),
  })),
};
const bookParts = hubParts.filter(p => groupOf(p) === 'book');
const examParts = hubParts.filter(p => groupOf(p) === 'exam');
const sqlTotal = hubParts.reduce((n, p) => n + p.chapters.reduce((k, c) => k + c.exercises.length, 0), 0);
const navItem = p => `<a class="lx-nav__item is-part" href="${p.slug}/playground.html" title="${escHtml(labelOf(p))} — ${escHtml(titleOf(p))}"><span class="lx-nav__k">${escHtml(keyOf(p))}</span><span class="lx-nav__t">${escHtml(titleOf(p))}</span></a>`;
const navGroup = (label, list) => (list.length ? `<div class="lx-nav__group"><div class="lx-nav__label">${label}</div>${list.map(navItem).join('')}</div>` : '');
const hub = `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>CS4420 Practice Lab</title>
${fonts}${css}
<style>
  .hub-stepper { display: inline-flex; align-items: center; gap: 4px; height: var(--control-height); padding: 0 2px; border: 1px solid var(--control); border-radius: 999px; }
  .hub-stepper .lx-iconbtn { width: 30px; height: 30px; }
  .hub-stepper .lx-iconbtn::after { bottom: auto; top: calc(100% + 6px); }
  .hub-stepper output { min-width: 76px; text-align: center; font-size: 13px; color: var(--text-2); }
  .hub-stepper output .n { color: var(--text); font-weight: 600; }
  .hub-rows { display: flex; flex-direction: column; }
  .hub-row { display: grid; grid-template-columns: 52px minmax(200px, 1fr) minmax(220px, 420px) 72px 72px 32px; align-items: center; gap: 0 20px; padding: 14px 20px; border-top: 1px solid var(--rule); }
  .hub-row:hover { background: var(--hover); }
  .hub-row--head { padding-top: 0; padding-bottom: 10px; border-top: 0; color: var(--muted); font-size: 12px; line-height: 16px; }
  .hub-row--head:hover { background: none; }
  .hub-row--head .r { font-family: var(--font); font-size: 12px; }
  .hub-row .r { text-align: right; font-family: var(--mono); font-variant-numeric: tabular-nums; }
  .hub-row .r small { color: var(--muted); font-size: 12px; }
  .hub-row .lx-cellmap { gap: 2px; }
  .hub-row .lx-cellmap a { width: 10px; height: 10px; }
  .lx-sidebar__note { flex: 1; padding: 0 8px; color: var(--muted); font-size: 12px; }
  .hub-empty { padding: 4px 20px 20px; color: var(--muted); }
  .hub-word { font-family: var(--font); font-weight: 600; letter-spacing: -.01em; }
  .lx-week__t { -webkit-line-clamp: 3; }
  .lx-kpi__v .n { font: inherit; }
  @media (max-width: 1100px) { .hub-row { grid-template-columns: 48px minmax(160px, 1fr) minmax(160px, 260px) 64px 32px; } .hub-row > .hub-ess { display: none; } }
  @media (max-width: 900px) {
    .hub-row { grid-template-columns: 40px minmax(0, 1fr) auto; grid-template-areas: "k t s" "c c c"; gap: 10px 12px; padding: 14px 16px; }
    .hub-row--head { display: none; }
    .hub-row > .lx-row__k { grid-area: k; } .hub-row > .lx-row__t { grid-area: t; } .hub-row > .lx-cellmap { grid-area: c; } .hub-row > .hub-sql { grid-area: s; }
    .hub-row > .hub-ess, .hub-row > .lx-iconbtn { display: none; }
    .lx-head > .lx-actions { width: auto; }
  }
</style>
</head>
<body>
<div class="lx-app" id="app">
  <header class="lx-mbar">
    <button class="lx-iconbtn" type="button" id="menuBtn" aria-controls="sidebar" aria-expanded="false" aria-label="Mở menu"><svg class="i" viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11"/></svg></button>
    <span class="lx-brand__mark">${brandSvg}</span><span class="lx-mbar__title">CS4420 Practice Lab</span>
    ${themeBtn}
  </header>
  <aside class="lx-sidebar" id="sidebar">
    <a class="lx-brand" href="index.html"><span class="lx-brand__mark">${brandSvg}</span><span class="lx-brand__name">Practice Lab<span>CS4420 · Database Systems</span></span></a>
    <nav class="lx-nav" aria-label="Các part">
      <div class="lx-nav__group"><a class="lx-nav__item is-active" href="index.html" aria-current="page"><svg class="i" viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 4h11v9.5h-11zM2.5 7h11M5.5 2.5v3M10.5 2.5v3"/></svg><span class="lx-nav__t">Lịch học &amp; tiến độ</span></a></div>
      ${navGroup('Theo sách', bookParts)}
      ${navGroup('Ôn thi', examParts)}
    </nav>
    <div class="lx-sidebar__foot">${syncBtn}<span class="lx-sidebar__note" data-sync-text>Đang đồng bộ…</span>${themeBtn}</div>
  </aside>
  <div class="lx-content"><main class="lx-page" id="main">
    <div class="lx-head"><div class="lx-head__text">
      <h1 class="lx-h1">Lịch học &amp; tiến độ</h1>
      <p class="lx-ctx" style="margin:6px 0 0">CS4420 · Database System Concepts, 7th Ed. · ${bookParts.length} part theo sách, ${examParts.length} phần ôn thi · ${sqlTotal} bài SQL chấm trên PostgreSQL trong trình duyệt</p>
      <p class="lx-find" id="find">Học theo chương ở các part theo sách; trước mỗi kỳ thi, làm phần ôn thi tương ứng — bám sát Practice Exercises của sách.</p></div>
      <div class="lx-actions"><div class="hub-stepper" role="group" aria-label="Tuần hiện tại">
        <button class="lx-iconbtn" type="button" id="weekPrev" data-tip="Tuần trước" aria-label="Tuần trước"><svg class="i" viewBox="0 0 16 16" aria-hidden="true"><path d="M10 4L6 8l4 4"/></svg></button>
        <output id="weekOut" aria-live="polite">Tuần <span class="n">1</span></output>
        <button class="lx-iconbtn" type="button" id="weekNext" data-tip="Tuần sau" aria-label="Tuần sau"><svg class="i" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 4l4 4-4 4"/></svg></button>
      </div></div>
    </div>
    <div class="lx-card lx-kpis" id="kpis"></div>
    <div class="lx-card" id="thisWeek"></div>
    <div class="lx-card"><div class="lx-card__head"><h2 class="lx-h2">Lịch 15 tuần</h2><span class="lx-card__meta">Chọn một tuần để xem phần cần luyện</span></div><div class="lx-weeks" id="weeks"></div></div>
    <div class="lx-card" id="book"></div>
    ${examParts.length ? '<div class="lx-card" id="exam"></div>' : ''}
  </main></div>
</div>
<script id="hubData" type="application/json">${JSON.stringify(hubData).replace(/</g, '\\u003c')}</script>
<script>
(() => {
  const HUB = JSON.parse(document.getElementById('hubData').textContent);
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const get = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } };
  const OPEN = '<svg class="i" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4"/></svg>';
  const WORD = { pass: 'đã đúng', fail: 'chưa đúng' };
  const bySlug = Object.fromEntries(HUB.parts.map(p => [p.slug, p]));
  const status = (p, id) => get(p.storage + ':status:' + id, null);
  const essaysDone = (p, c) => get(p.storage + ':essay:' + c.store, []).filter(i => i < c.essays).length;
  const href = (p, hash = '') => p.slug + '/playground.html' + hash;
  const cells = (p, chapters) => '<div class="lx-cellmap" role="list">' + chapters.map(c => c.ex.map(([id, topic]) => {
    const s = status(p, id);
    return '<a role="listitem"' + (s ? ' class="is-' + s + '"' : '') + ' href="' + href(p, '#/' + c.key + '/ex/' + id) + '" title="Bài ' + esc(id) + ' · ' + esc(topic) + '" aria-label="Bài ' + esc(id) + ': ' + (WORD[s] || 'chưa làm') + '"></a>';
  }).join('')).join('') + '</div>';
  const tally = (p, chapters) => chapters.reduce((t, c) => {
    c.ex.forEach(([id]) => { if (status(p, id) === 'pass') t.pass++; });
    t.total += c.ex.length; t.essays += essaysDone(p, c); t.essayTotal += c.essays; return t;
  }, { pass: 0, total: 0, essays: 0, essayTotal: 0 });
  const legend = '<div class="lx-legend" aria-hidden="true"><span><i class="is-pass"></i>Đã đúng</span><span><i class="is-fail"></i>Chưa đúng</span><span><i></i>Chưa làm</span></div>';
  const head = first => '<div class="hub-row hub-row--head" aria-hidden="true"><span></span><span>' + first + '</span><span>Mỗi ô là một bài SQL</span><span class="r">SQL</span><span class="r hub-ess">Tự luận</span><span></span></div>';
  const row = (k, p, chapters, title, sub, link) => {
    const t = tally(p, chapters);
    return '<div class="hub-row"><span class="lx-row__k">' + esc(k) + '</span><div class="lx-row__t"><a href="' + link + '">' + esc(title) + '</a><div class="lx-row__sub">' + esc(sub) + '</div></div>' +
      cells(p, chapters) + '<span class="r hub-sql">' + t.pass + '<small>/' + t.total + '</small></span><span class="r hub-ess">' + t.essays + '<small>/' + t.essayTotal + '</small></span>' +
      '<a class="lx-iconbtn" href="' + link + '" data-tip="Mở" aria-label="Mở ' + esc(title) + '">' + OPEN + '</a></div>';
  };
  const partRows = list => list.map(p => row(p.key, p, p.chapters, p.title, [p.label, p.weeks, p.subtitle].filter(Boolean).join(' · '), href(p))).join('');
  const examWeek = kind => (HUB.schedule.find(w => w.exam === kind) || {}).week;
  const until = (w, now) => (!w ? '<span class="lx-dash">–</span>' : w === now ? '<span class="hub-word">Tuần này</span>' : w < now ? '<span class="hub-word">Đã thi</span>' : (w - now) + '<span class="lx-kpi__u"> tuần nữa</span>');
  const short = s => s.replace(/^Chương /, 'Ch ');

  let week = Math.min(15, Math.max(1, Number(get('cs4420:week', 1)) || 1));
  function render() {
    const w = HUB.schedule.find(x => x.week === week) || HUB.schedule[0];
    $('#weekOut').innerHTML = 'Tuần <span class="n">' + week + '</span>';
    $('#weekPrev').disabled = week <= 1; $('#weekNext').disabled = week >= HUB.schedule.length;
    const all = HUB.parts.reduce((t, p) => { const x = tally(p, p.chapters); t.pass += x.pass; t.total += x.total; return t; }, { pass: 0, total: 0 });
    const mid = examWeek('midterm'), fin = examWeek('final');
    $('#kpis').innerHTML =
      '<div class="lx-kpi lx-kpi--lead"><div class="lx-kpi__k">Tuần đang học</div><div class="lx-kpi__v">' + week + '<span class="lx-kpi__u"> /' + HUB.schedule.length + '</span></div><div class="lx-meter" aria-hidden="true"><i style="width:' + (100 * week / HUB.schedule.length).toFixed(1) + '%"></i></div></div>' +
      '<div class="lx-kpi"><div class="lx-kpi__k">Thi giữa kỳ' + (mid ? ' · tuần ' + mid : '') + '</div><div class="lx-kpi__v">' + until(mid, week) + '</div><div class="lx-kpi__n">' + esc((HUB.schedule.find(x => x.week === mid) || {}).note || '') + '</div></div>' +
      '<div class="lx-kpi"><div class="lx-kpi__k">Thi cuối kỳ' + (fin ? ' · tuần ' + fin : '') + '</div><div class="lx-kpi__v">' + until(fin, week) + '</div><div class="lx-kpi__n">' + esc((HUB.schedule.find(x => x.week === fin) || {}).note || '') + '</div></div>' +
      '<div class="lx-kpi"><div class="lx-kpi__k">Bài SQL đã đúng, cả khoá</div><div class="lx-kpi__v">' + all.pass + '<span class="lx-kpi__u"> /' + all.total + '</span></div><div class="lx-kpi__n">Lưu trong trình duyệt này</div></div>';
    const exam = w.exam === 'midterm' ? 'Thi giữa kỳ' : w.exam === 'final' ? 'Thi cuối kỳ' : '';
    $('#find').innerHTML = 'Tuần ' + week + ': ' + esc(exam || w.content) + (w.note ? ' · ' + esc(w.note) : '') + '.' +
      (mid && week < mid ? ' Thi giữa kỳ sau <span class="n">' + (mid - week) + '</span> tuần.' : fin && week < fin ? ' Thi cuối kỳ sau <span class="n">' + (fin - week) + '</span> tuần.' : '');
    const links = w.links.map(l => ({ p: bySlug[l.slug], c: bySlug[l.slug] && bySlug[l.slug].chapters.find(c => c.key === l.key) })).filter(x => x.c);
    $('#thisWeek').innerHTML = '<div class="lx-card__head"><h2 class="lx-h2">Tuần ' + week + ' · ' + esc(exam || w.content) + '</h2>' + legend + '</div>' +
      (links.length ? '<div class="hub-rows">' + head('Phần') + links.map(({ p, c }) => row(short(c.nav), p, [c], c.title, p.label + ' · ' + p.title, href(p, '#/' + c.key))).join('') + '</div>'
        : '<p class="hub-empty">Tuần này không có phần luyện tập gắn sẵn. Chọn tuần khác trên lịch.</p>');
    $('#weeks').innerHTML = HUB.schedule.map(x => {
      const ex = x.exam === 'midterm' ? 'Thi giữa kỳ' : x.exam === 'final' ? 'Thi cuối kỳ' : '';
      return '<button type="button" class="lx-week' + (x.week === week ? ' is-now' : '') + '" data-week="' + x.week + '" aria-pressed="' + (x.week === week) + '" title="Tuần ' + x.week + ': ' + esc(x.content) + (x.note ? ' — ' + esc(x.note) : '') + '">' +
        '<span class="lx-week__n">T' + x.week + '</span>' + (ex ? '<span class="lx-week__exam">' + ex + '</span>' : '') + '<span class="lx-week__t">' + esc(x.links.map(l => bySlug[l.slug] && (bySlug[l.slug].chapters.find(c => c.key === l.key) || {}).nav).filter(Boolean).map(short).join(' · ') || x.content) + '</span></button>';
    }).join('');
    const books = HUB.parts.filter(p => p.group === 'book'), exams = HUB.parts.filter(p => p.group === 'exam');
    $('#book').innerHTML = '<div class="lx-card__head"><h2 class="lx-h2">Theo sách</h2><span class="lx-card__meta">' + books.length + ' part · học theo chương: tóm tắt, trắc nghiệm, tự luận, bài SQL</span></div><div class="hub-rows">' + head('Part') + partRows(books) + '</div>';
    if ($('#exam')) $('#exam').innerHTML = '<div class="lx-card__head"><h2 class="lx-h2">Ôn thi</h2><span class="lx-card__meta">Toàn bộ Practice Exercises của các chương thi, kèm đề thi thử</span></div><div class="hub-rows">' + head('Phần') + partRows(exams) + '</div>';
  }
  const setWeek = n => { week = Math.min(HUB.schedule.length, Math.max(1, n)); lxStore.set('cs4420:week', JSON.stringify(week)); render(); };
  $('#weekPrev').addEventListener('click', () => setWeek(week - 1));
  $('#weekNext').addEventListener('click', () => setWeek(week + 1));
  $('#weeks').addEventListener('click', e => { const b = e.target.closest('[data-week]'); if (b) setWeek(+b.dataset.week); });
  render();
  addEventListener('lx:synced', () => { week = Math.min(15, Math.max(1, Number(get('cs4420:week', 1)) || 1)); render(); });
  const app = $('#app'), btn = $('#menuBtn');
  btn.addEventListener('click', () => { const open = !app.classList.contains('is-navopen'); app.classList.toggle('is-navopen', open); btn.setAttribute('aria-expanded', String(open)); });
})();
</script>
</body>
</html>
`;
writeFileSync(path.join(REPO, 'index.html'), hub);
console.log(`Built ${built} part(s), ${total} exercises; hub -> index.html`);
process.exit(0);
