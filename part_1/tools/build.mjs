// Generates every derived file from content/*.mjs:
//   <chapter>/README.md, exercises.sql, solutions.sql, my_answers.sql (only if missing)
//   playground.html (self-contained practice page)
// Run with: npm run build
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { ROOT, SETUP_FILES, setupScripts, loadChapters, databaseProvider } from './common.mjs';
import { produceTable, runScript } from './engine.mjs';
import { block, inline, plain } from './md.mjs';

const chapters = await loadChapters();
const getDb = await databaseProvider();
const stars = n => '★'.repeat(n) + '☆'.repeat(3 - n);
const LETTERS = 'ABCD';

// ---------------------------------------------------------------- expected results
const expected = {};
for (const ch of chapters) {
  for (const ex of ch.exercises) {
    expected[ex.id] = await produceTable(await getDb(ex.fresh), ex.solution, ex.check, ex.fresh);
  }
}

// ---------------------------------------------------------------- per-chapter files
const sqlComment = text => plain(text).split('\n').map(l => ('-- ' + l).trimEnd()).join('\n');

function exerciseHeader(ch) {
  return `-- =====================================================================
-- CS4420 · Chương ${ch.number} — ${ch.titleVi} (${ch.title})
-- Dialect: PostgreSQL. Database: University (db/*.sql)
-- =====================================================================`;
}

function exerciseBlock(ex) {
  const lines = [`-- @ex ${ex.id}  [${ex.topic}]  ${stars(ex.level)}`, sqlComment(ex.prompt)];
  if (ex.hint) lines.push(sqlComment('Gợi ý: ' + ex.hint));
  if (ex.fresh) lines.push('-- (Bài này chạy trên một database mới — được dùng begin/commit/rollback.)');
  if (ex.ordered) lines.push('-- (Thứ tự dòng được chấm.)');
  return lines.join('\n');
}

for (const ch of chapters) {
  const dir = path.join(ROOT, ch.slug);
  mkdirSync(dir, { recursive: true });

  const template = [
    exerciseHeader(ch),
    `-- Viết câu trả lời ngay dưới mỗi đề (giữ nguyên dòng "-- @ex ...").
-- Chấm tự động:   npm run grade -- ch${ch.number}
-- Bài tự chấm chạy trong một transaction rồi rollback, nên dữ liệu gốc không đổi.
-- Bài có "check" (DDL, insert, update...) được chấm bằng một câu truy vấn kiểm tra sau khi chạy.`,
    ...ch.exercises.map(ex => exerciseBlock(ex) + '\n\n\n'),
  ].join('\n\n');
  writeFileSync(path.join(dir, 'exercises.sql'), template);
  if (!existsSync(path.join(dir, 'my_answers.sql'))) writeFileSync(path.join(dir, 'my_answers.sql'), template);

  const solutions = [
    exerciseHeader(ch),
    `-- ĐÁP ÁN. Hãy tự làm trước khi xem!
-- Mỗi bài độc lập với nhau: chạy TỪNG bài (bôi đen rồi chạy). Chạy cả file một lần
-- sẽ thay đổi dữ liệu và tạo trùng tên object. Muốn về dữ liệu gốc: chạy lại db/*.sql.`,
    ...ch.exercises.map(ex => {
      let s = exerciseBlock(ex) + '\n' + ex.solution.trim();
      if (ex.check) s += '\n\n-- Câu truy vấn hệ thống dùng để chấm:\n' + ex.check.trim().split('\n').map(l => '--   ' + l).join('\n');
      return s;
    }),
  ].join('\n\n') + '\n';
  writeFileSync(path.join(dir, 'solutions.sql'), solutions);

  const md = [];
  md.push(`# Chương ${ch.number} — ${ch.titleVi}`);
  md.push(`*${ch.title} · Database System Concepts, 7th Ed.*`);
  md.push(`> **Cách học:** đọc *Tóm tắt kiến thức* → làm *Trắc nghiệm* → trả lời *Câu hỏi tự luận* → làm *Bài tập SQL* trong [\`playground.html\`](../playground.html) hoặc [\`my_answers.sql\`](my_answers.sql) (chấm bằng \`npm run grade -- ch${ch.number}\`). Đáp án SQL: [\`solutions.sql\`](solutions.sql).`);
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

// ---------------------------------------------------------------- schema reference
const db = await getDb(false);
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
const schema = {};
for (const [table, column, type, size, pk] of colRes.rows) {
  (schema[table] ||= []).push({ column, type: size ? `${type}(${size.replace(/,$/, '')})` : type, pk });
}
const coreTables = ['classroom', 'department', 'course', 'instructor', 'section', 'teaches', 'student', 'takes', 'advisor', 'time_slot', 'prereq'];
const tableOrder = [...coreTables, ...Object.keys(schema).filter(t => !coreTables.includes(t)).sort()];

// ---------------------------------------------------------------- playground.html
const data = {
  setup: setupScripts(),
  setupFiles: SETUP_FILES,
  schema: tableOrder.filter(t => schema[t]).map(t => ({ table: t, core: coreTables.includes(t), columns: schema[t] })),
  chapters: chapters.map(ch => ({
    number: ch.number,
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

const engineSource = readFileSync(path.join(ROOT, 'tools', 'engine.mjs'), 'utf8').replace(/^export /gm, '');
const json = JSON.stringify(data).replace(/</g, '\\u003c');
const html = readFileSync(path.join(ROOT, 'tools', 'playground.template.html'), 'utf8')
  .replace('/*__ENGINE__*/', () => engineSource)
  .replace('"__DATA__"', () => json);
writeFileSync(path.join(ROOT, 'playground.html'), html);

const total = chapters.reduce((n, c) => n + c.exercises.length, 0);
console.log(`Built ${chapters.length} chapters, ${total} exercises -> playground.html (${Math.round(html.length / 1024)} KB)`);
process.exit(0);
