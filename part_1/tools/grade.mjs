// Grades an answer file containing `-- @ex <id>` blocks.
//   npm run grade -- ch3                 -> ch3_intro_sql/my_answers.sql
//   npm run grade -- path/to/answers.sql
import { readFileSync, existsSync } from 'node:fs';
import { loadChapters, databaseProvider, resolveAnswerFile } from './common.mjs';
import { gradeExercise, parseAnswerFile, isBlank } from './engine.mjs';

const chapters = await loadChapters();
const exercises = new Map(chapters.flatMap(c => c.exercises).map(e => [e.id, e]));

const targets = process.argv.slice(2);
if (!targets.length) {
  console.log('Cách dùng: npm run grade -- ch3   (hoặc đường dẫn tới file .sql có các khối -- @ex <id>)');
  process.exit(1);
}

const getDb = await databaseProvider();
let passed = 0, failed = 0, skipped = 0;

for (const target of targets) {
  const file = resolveAnswerFile(target, chapters);
  if (!existsSync(file)) { console.log(`Không tìm thấy ${file}`); continue; }
  console.log(`\n=== ${file}`);
  for (const [id, sql] of parseAnswerFile(readFileSync(file, 'utf8'))) {
    const ex = exercises.get(id);
    if (!ex) { console.log(`  ?  ${id}: không có bài tập với id này`); continue; }
    if (isBlank(sql)) { skipped++; continue; }
    const res = await gradeExercise(getDb, ex, sql);
    if (res.ok) { passed++; console.log(`  ✓  ${id} [${ex.topic}]`); }
    else { failed++; console.log(`  ✗  ${id} [${ex.topic}] — ${res.reason}`); }
  }
}
console.log(`\nĐúng: ${passed}   Sai: ${failed}   Chưa làm: ${skipped}`);
