// Grades an answer file containing `-- @ex <id>` blocks.
//   npm run grade -- ch3                 -> part_1/ch3_intro_sql/my_answers.sql
//   npm run grade -- gk2                 -> my_answers.sql of review section gk2
//   npm run grade -- path/to/answers.sql
import { readFileSync, existsSync } from 'node:fs';
import { loadParts, databaseProvider, resolveAnswerFile } from './common.mjs';
import { gradeExercise, parseAnswerFile, isBlank } from './engine.mjs';

const parts = await loadParts();
const exercises = new Map();
for (const part of parts) for (const ch of part.chapters) for (const ex of ch.exercises) exercises.set(ex.id, { ex, part });

const targets = process.argv.slice(2);
if (!targets.length) {
  const keys = parts.flatMap(p => p.chapters.map(c => c.key)).join(', ');
  console.log(`Cách dùng: npm run grade -- ch3   (hoặc đường dẫn tới file .sql có các khối -- @ex <id>)\nCác mã có sẵn: ${keys}`);
  process.exit(1);
}

const providers = new Map(); // one shared database per part
const dbFor = async part => {
  if (!providers.has(part.slug)) providers.set(part.slug, await databaseProvider(part.setup));
  return providers.get(part.slug);
};
let passed = 0, failed = 0, skipped = 0;

for (const target of targets) {
  const file = resolveAnswerFile(target, parts);
  if (!existsSync(file)) { console.log(`Không tìm thấy ${file}`); continue; }
  console.log(`\n=== ${file}`);
  for (const [id, sql] of parseAnswerFile(readFileSync(file, 'utf8'))) {
    const found = exercises.get(id);
    if (!found) { console.log(`  ?  ${id}: không có bài tập với id này`); continue; }
    if (isBlank(sql)) { skipped++; continue; }
    const res = await gradeExercise(await dbFor(found.part), found.ex, sql);
    if (res.ok) { passed++; console.log(`  ✓  ${id} [${found.ex.topic}]`); }
    else { failed++; console.log(`  ✗  ${id} [${found.ex.topic}] — ${res.reason}`); }
  }
}
console.log(`\nĐúng: ${passed}   Sai: ${failed}   Chưa làm: ${skipped}`);
