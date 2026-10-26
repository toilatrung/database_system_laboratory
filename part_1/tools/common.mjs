// Node-only helpers shared by the CLI tools.
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { createDatabase } from './engine.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const SETUP_FILES = ['db/university_schema.sql', 'db/university_data.sql', 'db/extra_tables.sql'];

export function setupScripts() {
  return SETUP_FILES.map(f => readFileSync(path.join(ROOT, f), 'utf8'));
}

export async function newDatabase() {
  return createDatabase(PGlite, setupScripts());
}

// Returns a getDb(fresh) function for gradeExercise: one shared database,
// plus a brand-new database whenever an exercise is marked `fresh`.
export async function databaseProvider() {
  const shared = await newDatabase();
  return async fresh => (fresh ? newDatabase() : shared);
}

export async function loadChapters() {
  const chapters = [];
  for (let n = 1; n <= 5; n++) {
    const mod = await import(pathToFileURL(path.join(ROOT, 'content', `ch${n}.mjs`)).href);
    chapters.push(mod.default);
  }
  return chapters;
}

// Accepts "ch3", "3", a chapter folder or a file path.
export function resolveAnswerFile(arg, chapters) {
  const m = String(arg).match(/^(?:ch)?([1-5])$/i);
  if (m) {
    const ch = chapters[Number(m[1]) - 1];
    return path.join(ROOT, ch.slug, 'my_answers.sql');
  }
  const p = path.resolve(arg);
  if (existsSync(path.join(p, 'my_answers.sql'))) return path.join(p, 'my_answers.sql');
  return p;
}

// Plain-text table printer for query results.
export function formatTable(table) {
  const show = v => (v === null || v === undefined ? 'null' : v instanceof Date ? v.toISOString().replace('T00:00:00.000Z', '') : typeof v === 'object' ? JSON.stringify(v) : String(v));
  const rows = table.rows.map(r => r.map(show));
  const widths = table.fields.map((f, i) => Math.max(f.length, ...rows.map(r => r[i].length)));
  const line = (cells) => '│ ' + cells.map((c, i) => c.padEnd(widths[i])).join(' │ ') + ' │';
  const sep = (l, m, r) => l + widths.map(w => '─'.repeat(w + 2)).join(m) + r;
  return [
    sep('┌', '┬', '┐'),
    line(table.fields),
    sep('├', '┼', '┤'),
    ...rows.map(line),
    sep('└', '┴', '┘'),
    `(${rows.length} ${rows.length === 1 ? 'row' : 'rows'})`,
  ].join('\n');
}
