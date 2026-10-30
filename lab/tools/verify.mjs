// Self-test: every solution must run, and an empty answer must not pass.
//   npm run verify                 -> every part
//   npm run verify -- --part 3     -> one part
//   npm run verify -- -v           -> also print each expected result
import { loadParts, databaseProvider, formatTable, partFilter } from './common.mjs';
import { produceTable, gradeExercise } from './engine.mjs';

const { filter, rest } = partFilter(process.argv.slice(2));
const verbose = rest.includes('-v');
const parts = (await loadParts(filter)).filter(filter);
let problems = 0;

const ids = new Set();
for (const part of parts) {
  const getDb = await databaseProvider(part.setup);
  for (const ch of part.chapters) {
    console.log(`\n== ${part.slug} · ${ch.label}: ${ch.title}`);
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
}
console.log(problems ? `\n${problems} problem(s) found.` : '\nAll solutions OK.');
process.exit(problems ? 1 : 0);
