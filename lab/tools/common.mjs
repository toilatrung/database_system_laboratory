// Node-only helpers shared by the CLI tools.
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { createDatabase } from './engine.mjs';
import { resolvePE } from './pe.mjs';

export const LAB = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const REPO = path.resolve(LAB, '..');
export const DB_DIR = path.join(LAB, 'db');

// The eleven relations of the book's University schema.
export const CORE_TABLES = ['classroom', 'department', 'course', 'instructor', 'section', 'teaches', 'student', 'takes', 'advisor', 'time_slot', 'prereq'];

export function setupScripts(files) {
  return files.map(f => readFileSync(path.join(DB_DIR, f), 'utf8'));
}

export async function newDatabase(files) {
  return createDatabase(PGlite, setupScripts(files));
}

// Returns a getDb(fresh) function for gradeExercise: one shared database,
// plus a brand-new database whenever an exercise is marked `fresh`.
export async function databaseProvider(files) {
  const shared = await newDatabase(files);
  return async fresh => (fresh ? newDatabase(files) : shared);
}

// Fills in the display fields a chapter may leave out. Numbered book chapters
// keep `number`; review sections give their own `key` and labels.
// `pe: '3.2a'` on a question or exercise pulls the original statement from lab/pe/ into `en`.
const withPE = item => item.pe ? { ...item, en: resolvePE(item.pe) } : item;

function normalizeChapter(mod, part) {
  const key = mod.key || `ch${mod.number}`;
  return {
    ...mod,
    questions: (mod.questions || []).map(withPE),
    exercises: (mod.exercises || []).map(withPE),
    key,
    store: mod.key || String(mod.number),
    short: mod.short || String(mod.number),
    label: mod.label || `Chương ${mod.number}`,
    navLabel: mod.navLabel || mod.label || `Chương ${mod.number}`,
    kind: mod.kind || part.unit || 'Chương',
  };
}

// Every folder named part_<n> with a part.mjs is a part, ordered by number.
// Chapter content is imported only for parts accepted by `filter`; the others
// keep just their configuration (chapter names, titles).
export async function loadParts(filter = () => true) {
  const dirs = readdirSync(REPO, { withFileTypes: true })
    .filter(d => d.isDirectory() && /^part_\d+$/.test(d.name) && existsSync(path.join(REPO, d.name, 'part.mjs')))
    .map(d => d.name);
  const parts = [];
  for (const dir of dirs) {
    const cfg = (await import(pathToFileURL(path.join(REPO, dir, 'part.mjs')).href)).default;
    const part = { ...cfg, dir: path.join(REPO, dir), slug: dir, unit: cfg.unit || 'Chương' };
    part.chapters = [];
    part.loaded = filter(part);
    if (!part.loaded) { parts.push(part); continue; }
    for (const name of cfg.chapters) {
      const mod = (await import(pathToFileURL(path.join(part.dir, 'content', `${name}.mjs`)).href)).default;
      part.chapters.push(normalizeChapter(mod, part));
    }
    parts.push(part);
  }
  return parts.sort((a, b) => a.number - b.number);
}

// `--part 2` / `--part=2` / `-p 2` on the command line limits a tool to one part.
export function partFilter(argv) {
  const i = argv.findIndex(a => a === '--part' || a === '-p' || a.startsWith('--part='));
  if (i < 0) return { filter: () => true, rest: argv };
  const value = argv[i].includes('=') ? argv[i].split('=')[1] : argv[i + 1];
  const rest = argv.filter((_, j) => j !== i && (argv[i].includes('=') || j !== i + 1));
  return { filter: p => String(p.number) === String(value).replace(/^part_?/, ''), rest };
}

// Accepts a chapter key ("ch3", "3", "gk2"), a chapter folder or a file path.
export function resolveAnswerFile(arg, parts) {
  const want = String(arg).toLowerCase();
  for (const part of parts) {
    for (const ch of part.chapters) {
      if (ch.key.toLowerCase() === want || ch.key === `ch${want}`) return path.join(part.dir, ch.slug, 'my_answers.sql');
    }
  }
  const p = path.resolve(arg);
  if (existsSync(path.join(p, 'my_answers.sql'))) return path.join(p, 'my_answers.sql');
  return p;
}

// Union of every part's setup files, in first-seen order (for the SQL shell).
export function allSetupFiles(parts) {
  return [...new Set(parts.flatMap(p => p.setup))];
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
