// Self-test: every solution must run, and an empty answer must not pass.
//   npm run verify            -> summary
//   npm run verify -- -v      -> also print each expected result
import { loadChapters, databaseProvider, formatTable } from './common.mjs';
import { produceTable, gradeExercise } from './engine.mjs';

const verbose = process.argv.includes('-v');
const chapters = await loadChapters();
const getDb = await databaseProvider();
let problems = 0;

const ids = new Set();
for (const ch of chapters) {
  console.log(`\n== Chapter ${ch.number}: ${ch.title}`);
  for (const ex of ch.exercises) {
    if (ids.has(ex.id)) { problems++; console.log(`  !! duplicate id ${ex.id}`); }
    ids.add(ex.id);
    let expected;
    try {
      expected = await produceTable(await getDb(ex.fresh), ex.solution, ex.check, ex.fresh);
    } catch (e) {
      problems++;
      console.log(`  ✗ ${ex.id} solution error: ${e.message}`);
      continue;
    }
    if (!expected) { problems++; console.log(`  ✗ ${ex.id} solution returns no table`); continue; }
    const self = await gradeExercise(getDb, ex, ex.solution, expected);
    const blank = await gradeExercise(getDb, ex, '-- blank', expected);
    const flags = [];
    if (!self.ok) { problems++; flags.push('SELF-FAIL: ' + self.reason); }
    if (blank.ok) flags.push('blank answer passes');
    if (!expected.rows.length) flags.push('empty result');
    console.log(`  ${self.ok ? '✓' : '✗'} ${ex.id} ${ex.topic.padEnd(24)} ${String(expected.rows.length).padStart(3)} rows ${flags.length ? '  <-- ' + flags.join('; ') : ''}`);
    if (verbose) console.log(formatTable(expected).replace(/^/gm, '      '));
  }
}
console.log(problems ? `\n${problems} problem(s) found.` : '\nAll solutions OK.');
process.exit(problems ? 1 : 0);
