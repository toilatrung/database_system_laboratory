// Practice Exercises of the book, stored as text in lab/pe/ch*.md (see lab/pe/README.md).
// resolvePE('3.2a') -> markdown of the exercise stem + part a, with the figures it mentions.
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'pe');

function load() {
  const exercises = {}, figures = {};
  for (const file of readdirSync(DIR).filter(f => /^ch\d+\.md$/.test(f)).sort()) {
    let cur = null, part = null;
    for (const line of readFileSync(path.join(DIR, file), 'utf8').split('\n')) {
      let m;
      if ((m = line.match(/^## Figure (\S+)\s*$/))) { cur = figures[m[1]] = { stem: [] }; part = null; continue; }
      if ((m = line.match(/^## (\d+\.\d+)\s*$/))) { cur = exercises[m[1]] = { stem: [], parts: {} }; part = null; continue; }
      if (cur?.parts && (m = line.match(/^### (\S+)\s*$/))) { part = cur.parts[m[1]] = []; continue; }
      if (cur) (part || cur.stem).push(line);
    }
  }
  const text = lines => lines.join('\n').trim();
  for (const e of [...Object.values(exercises), ...Object.values(figures)]) {
    e.stem = text(e.stem);
    for (const k in e.parts || {}) e.parts[k] = text(e.parts[k]);
  }
  return { exercises, figures };
}

const { exercises, figures } = load();

function one(ref) {
  const m = String(ref).match(/^(\d+\.\d+)([a-z]*)$/);
  const ex = m && exercises[m[1]];
  if (!ex) throw new Error(`Practice Exercise "${ref}" not found in lab/pe/`);
  const labels = Object.keys(ex.parts).filter(k => k !== '~');
  const wanted = m[2] ? [...m[2]] : labels;
  for (const k of wanted) if (!labels.includes(k)) throw new Error(`Practice Exercise ${m[1]} has no part "${k}"`);
  const body = [ex.stem, ...wanted.map(k => `${k}. ${ex.parts[k]}`), ex.parts['~']].filter(Boolean).join('\n\n');
  return `**Exercise ${m[1]}${m[2] ? ` (${[...m[2]].join(', ')})` : ''}.** ${body}`;
}

export function resolvePE(refs) {
  const list = [].concat(refs);
  const texts = list.map(one);
  const mentioned = [...new Set(texts.join('\n').match(/Figure \d+\.\d+/g) || [])].map(f => f.slice(7)).filter(f => figures[f]);
  return [...texts, ...mentioned.map(f => figures[f].stem)].join('\n\n');
}

export const peCount = () => Object.keys(exercises).length;
