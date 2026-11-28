// Shared grading engine — used by the Node tools (run/grade/verify/build)
// and inlined into playground.html by build.mjs. Keep it free of imports
// so it runs unchanged in the browser.

// True when a script issues its own transaction control. Function bodies
// ($$ ... $$), string literals and comments are ignored, since a PL/pgSQL
// `begin ... end` block is not a transaction.
export function hasTxControl(sql) {
  const code = sql
    .replace(/\$([A-Za-z_]*)\$[\s\S]*?\$\1\$/g, ' ')
    .replace(/'(?:[^']|'')*'/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/--.*$/gm, ' ');
  return /\b(begin(?!\s+atomic)|commit|rollback|start\s+transaction)\b/i.test(code);
}

// Date/time values are kept as PostgreSQL's own text ('2018-03-01',
// '2018-03-08 00:00:00') instead of JS Dates, so results do not depend on
// the local time zone.
const RAW = v => v;
export const RAW_TEXT_PARSERS = { 1082: RAW, 1083: RAW, 1114: RAW, 1184: RAW, 1266: RAW };

export async function createDatabase(PGlite, setupScripts) {
  const db = new PGlite({ parsers: RAW_TEXT_PARSERS });
  for (const sql of setupScripts) await db.exec(sql);
  return db;
}

// Runs a multi-statement script and returns one entry per statement.
export async function runScript(db, sql) {
  const res = await db.exec(sql, { rowMode: 'array' });
  return res.map(r => ({
    fields: (r.fields || []).map(f => f.name),
    types: (r.fields || []).map(f => f.dataTypeID),
    rows: r.rows || [],
    affectedRows: r.affectedRows ?? 0,
  }));
}

export function lastTable(results) {
  for (let i = results.length - 1; i >= 0; i--) {
    if (results[i].fields.length) return results[i];
  }
  return null;
}

// int2, int4, int8, float4, float8, numeric
const NUMERIC_TYPES = new Set([20, 21, 23, 700, 701, 1700]);

// Canonical text for comparing values: numbers lose trailing zeros
// ('65000.00' -> '65000') and are rounded to 4 decimals; strings such as
// IDs ('00128') stay untouched.
export function normalizeValue(v, type) {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'bigint') v = Number(v);
  if (typeof v === 'number' || (NUMERIC_TYPES.has(type) && typeof v === 'string' && v !== 'NaN')) {
    const n = Math.round(Number(v) * 10000) / 10000;
    return String(n);
  }
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

export function normalizeTable(table) {
  if (!table) return null;
  return {
    fields: table.fields,
    rows: table.rows.map(r => r.map((v, i) => normalizeValue(v, table.types?.[i]))),
  };
}

// Compares two normalized tables. Column names are ignored; column order
// and values matter. Row order matters only when `ordered` is true.
export function compareTables(expected, actual, ordered) {
  if (!actual) return { ok: false, reason: 'Câu lệnh của bạn không trả về bảng kết quả nào (cần có một câu SELECT ở cuối).' };
  if (!expected) return { ok: false, reason: 'Đáp án không có bảng kết quả.' };
  if (expected.fields.length !== actual.fields.length) {
    return { ok: false, reason: `Số cột khác nhau: mong đợi ${expected.fields.length} cột (${expected.fields.join(', ')}), bạn trả về ${actual.fields.length} cột.` };
  }
  const key = r => JSON.stringify(r);
  const exp = expected.rows.map(key);
  const act = actual.rows.map(key);
  if (exp.length !== act.length) {
    return { ok: false, reason: `Số dòng khác nhau: mong đợi ${exp.length} dòng, bạn trả về ${act.length} dòng.` };
  }
  if (ordered) {
    const sameSet = [...exp].sort().join('\n') === [...act].sort().join('\n');
    if (exp.join('\n') !== act.join('\n')) {
      return { ok: false, reason: sameSet ? 'Đúng các dòng nhưng SAI THỨ TỰ — kiểm tra lại order by.' : 'Giá trị các dòng chưa khớp với đáp án.' };
    }
    return { ok: true };
  }
  const count = new Map();
  for (const k of exp) count.set(k, (count.get(k) || 0) + 1);
  let missing = 0;
  for (const k of act) {
    const c = count.get(k) || 0;
    if (c === 0) missing++;
    else count.set(k, c - 1);
  }
  if (missing) return { ok: false, reason: `${missing} dòng trong kết quả của bạn không có trong đáp án.` };
  return { ok: true };
}

// Executes `sql` (then `check`, if given) and returns the normalized table
// used for grading. Unless `fresh`, everything runs inside a transaction
// that is rolled back, so the shared database is never modified.
// `seed` (optional SQL) adds a chapter's own rows first, inside that transaction.
export async function produceTable(db, sql, check, fresh, seed) {
  if (fresh) {
    if (seed) await db.exec(seed);
    const results = await runScript(db, sql);
    const table = check ? lastTable(await runScript(db, check)) : lastTable(results);
    return normalizeTable(table);
  }
  await db.exec('begin');
  try {
    if (seed) await db.exec(seed);
    const results = await runScript(db, sql);
    const table = check ? lastTable(await runScript(db, check)) : lastTable(results);
    return normalizeTable(table);
  } finally {
    await db.exec('rollback');
    await db.exec('reset role');
  }
}

// Grades one exercise. `getDb(fresh)` returns the database to use: the
// shared one, or a brand-new one for exercises marked `fresh`.
export async function gradeExercise(getDb, ex, userSql, expected) {
  if (!ex.fresh && hasTxControl(userSql)) {
    return { ok: false, reason: 'Bài này được chấm bên trong một transaction tự động — hãy bỏ BEGIN/COMMIT/ROLLBACK khỏi câu trả lời.' };
  }
  // Fresh databases are single-use: close them once the run is done.
  const produce = async sql => {
    const db = await getDb(ex.fresh);
    try { return await produceTable(db, sql, ex.check, ex.fresh, ex.seed); }
    finally { if (ex.fresh) await db.close(); }
  };
  const exp = expected || await produce(ex.solution);
  let actual;
  try {
    actual = await produce(userSql);
  } catch (e) {
    return { ok: false, reason: 'Lỗi SQL: ' + e.message, error: true };
  }
  return { ...compareTables(exp, actual, ex.ordered), expected: exp, actual };
}

// Splits an answer file into blocks keyed by the `-- @ex <id>` markers.
export function parseAnswerFile(text) {
  const blocks = new Map();
  let current = null;
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^--\s*@ex\s+(\S+)/);
    if (m) { current = m[1]; blocks.set(current, []); continue; }
    if (current) blocks.get(current).push(line);
  }
  const out = new Map();
  for (const [id, lines] of blocks) out.set(id, lines.join('\n'));
  return out;
}

export function isBlank(sql) {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split(/\r?\n/)
    .filter(l => !/^\s*--/.test(l))
    .join('')
    .trim() === '';
}

// ======================================================================
// Debug: run a script one step at a time
// ======================================================================
// `planDebug(sql)` cuts a script into the steps a reader can watch: every
// statement, and inside a SELECT its clauses in logical order (FROM, each
// JOIN, WHERE, GROUP BY, HAVING, SELECT, ORDER BY/LIMIT), every WITH table
// and every operand of UNION/INTERSECT/EXCEPT. Steps marked `real` are the
// statements themselves; the others are read-only queries built from a
// prefix of the clauses. `range` is [start, end) in the original text.

// Comments, string literals and quoted identifiers are blanked out so
// keywords and `;` can be found with plain regexes (string bodies become
// '_' so they never read as keywords). `depth[i]` is the parenthesis depth
// before character i.
function maskSql(sql) {
  const out = sql.split('');
  const blank = (a, b, ch) => { for (let k = a; k < b; k++) if (out[k] !== '\n') out[k] = ch; };
  let i = 0;
  while (i < sql.length) {
    const c = sql[i], n = sql[i + 1];
    let e = -1;
    if (c === '-' && n === '-') { e = sql.indexOf('\n', i); if (e < 0) e = sql.length; blank(i, e, ' '); }
    else if (c === '/' && n === '*') { e = sql.indexOf('*/', i + 2); e = e < 0 ? sql.length : e + 2; blank(i, e, ' '); }
    else if (c === "'" || c === '"') {
      e = i + 1;
      while (e < sql.length && !(sql[e] === c && sql[e + 1] !== c)) e += sql[e] === c ? 2 : 1;
      e = Math.min(e + 1, sql.length);
      blank(i, e, '_');
    } else if (c === '$') {
      const tag = /^\$(?:[A-Za-z_]\w*)?\$/.exec(sql.slice(i, i + 64));
      if (tag) { e = sql.indexOf(tag[0], i + tag[0].length); e = e < 0 ? sql.length : e + tag[0].length; blank(i, e, '_'); }
    }
    i = e > i ? e : i + 1;
  }
  const code = out.join('');
  const depth = new Int32Array(code.length + 1);
  let d = 0;
  for (let k = 0; k < code.length; k++) {
    depth[k] = d;
    if (code[k] === '(') d++;
    else if (code[k] === ')') d = Math.max(0, d - 1);
  }
  depth[code.length] = d;
  return { code, depth };
}

// Top-level (depth 0) matches of a global regex whose first group is the keyword.
function topMatches(re, m, from = 0, to = m.code.length) {
  const found = [];
  re.lastIndex = from;
  let x;
  while ((x = re.exec(m.code)) && x.index < to) {
    if (m.depth[x.index] === 0) found.push({ kw: x[1].toLowerCase().replace(/\s+/g, ' '), index: x.index, len: x[0].length });
  }
  return found;
}

function closeParen(m, p) {
  for (let k = p + 1; k < m.code.length; k++) if (m.code[k] === ')' && m.depth[k] === m.depth[p] + 1) return k;
  return -1;
}

// Statements with their offsets, without the `;` and surrounding blanks/comments.
export function splitStatements(sql) {
  const m = maskSql(sql);
  const list = [];
  let start = 0;
  for (let k = 0; k <= m.code.length; k++) {
    if (k < m.code.length && !(m.code[k] === ';' && m.depth[k] === 0)) continue;
    const seg = m.code.slice(start, k);
    const a = seg.search(/\S/);
    if (a >= 0) {
      const b = seg.trimEnd().length;
      list.push({ start: start + a, end: start + b, text: sql.slice(start + a, start + b) });
    }
    start = k + 1;
  }
  return list;
}

// `with a as (...), b (x, y) as (...) <main>` -> the WITH tables and where <main> starts.
function parseWith(t, m) {
  const head = /^with\s+(?:recursive\s+)?/i.exec(m.code);
  if (!head) return null;
  let p = head[0].length;
  const ctes = [];
  const skip = () => { p += /^\s*/.exec(m.code.slice(p))[0].length; };
  for (;;) {
    const nm = /^([A-Za-z_][\w$]*)\s*/.exec(m.code.slice(p));
    if (!nm) return null;
    const name = t.slice(p, p + nm[1].length);
    const start = p;
    p += nm[0].length;
    if (m.code[p] === '(') { p = closeParen(m, p) + 1; if (!p) return null; skip(); }
    const as = /^as\s+(?:not\s+)?(?:materialized\s+)?/i.exec(m.code.slice(p));
    if (!as) return null;
    p += as[0].length;
    if (m.code[p] !== '(') return null;
    const close = closeParen(m, p);
    if (close < 0) return null;
    ctes.push({ name, start, end: close + 1 });
    p = close + 1;
    const comma = /^\s*,\s*/.exec(m.code.slice(p));
    if (comma) { p += comma[0].length; continue; }
    skip();
    return { ctes, mainStart: p };
  }
}

const CLAUSE_RE = /\b(select|from|where|group\s+by|having|window|order\s+by|limit|offset|fetch|union|intersect|except)\b/gi;
const JOIN_RE = /(,|\b(?:natural\s+)?(?:(?:left|right|full)(?:\s+outer)?\s+|inner\s+|cross\s+)?join\b)/gi;
const DML_RE = /^(?:insert\s+into|update(?:\s+only)?|delete\s+from(?:\s+only)?|truncate(?:\s+table)?|create\s+(?:temp(?:orary)?\s+|unlogged\s+)?table(?:\s+if\s+not\s+exists)?|alter\s+table(?:\s+if\s+exists)?)\s+([A-Za-z_][\w$.]*)/i;
export const GROUP_COUNT_COLUMN = 'số dòng trong nhóm';

// Steps of one statement; offsets are relative to the statement.
function planStatement(t) {
  const m = maskSql(t);
  const steps = [];
  const one = (step, a, b) => steps.push({ ...step, range: [a, b] });
  const trimEnd = (a, b) => a + t.slice(a, b).trimEnd().length;

  const w = parseWith(t, m);
  const ms = w ? w.mainStart : 0;
  const prefix = t.slice(0, ms);
  const marks = topMatches(CLAUSE_RE, m, ms)
    // `a is distinct from b` is not a FROM clause
    .filter(k => !(k.kw === 'from' && /\bdistinct\s+$/i.test(m.code.slice(Math.max(0, k.index - 20), k.index))));
  const isSelect = marks.length && marks[0].kw === 'select' && marks[0].index === ms;

  if (!isSelect) {
    const target = DML_RE.exec(m.code);
    one({ kind: 'stmt', label: (/^\s*([A-Za-z]+)/.exec(t) || ['', 'SQL'])[1].toUpperCase(), sql: t, real: true,
      snapshot: target ? t.slice(target.index + target[0].length - target[1].length, target.index + target[0].length) : '' }, 0, t.length);
    return steps;
  }
  if (w) w.ctes.forEach(c => one({ kind: 'cte', label: 'WITH ' + c.name, sql: `${t.slice(0, c.end)}\nselect * from ${c.name}` }, c.start, c.end));

  const setops = marks.filter(k => ['union', 'intersect', 'except'].includes(k.kw));
  if (setops.length) {
    let a = ms;
    setops.forEach((k, i) => {
      one({ kind: 'setop', label: `Vế ${i + 1}`, sql: prefix + t.slice(a, k.index).trim() }, a, trimEnd(a, k.index));
      a = k.index + k.len + (/^\s+all\b/i.exec(m.code.slice(k.index + k.len)) || [''])[0].length;
      a += /^\s*/.exec(m.code.slice(a))[0].length;
    });
    one({ kind: 'setop', label: `Vế ${setops.length + 1}`, sql: prefix + t.slice(a).trim() }, a, t.length);
    one({ kind: 'final', label: [...new Set(setops.map(k => k.kw.toUpperCase()))].join(' / '), sql: t, real: true }, setops[0].index, t.length);
    return steps;
  }

  const cl = {};
  marks.forEach((k, i) => {
    const key = ['order by', 'limit', 'offset', 'fetch'].includes(k.kw) ? 'order' : k.kw;
    const end = trimEnd(k.index, i + 1 < marks.length ? marks[i + 1].index : t.length);
    if (cl[key]) cl[key].end = end;
    else cl[key] = { start: k.index, end, body: k.index + k.len, kw: k.kw };
  });
  const txt = c => (c ? ' ' + t.slice(c.start, c.end) : '');
  const body = c => t.slice(c.body, c.end).trim();
  const sel = cl.select;

  if (cl.from) {
    const f = cl.from;
    const joins = topMatches(JOIN_RE, m, f.body, f.end).filter(j => j.index < f.end);
    const joinLabel = j => (j.kw === ',' ? ', (tích Descartes)' : j.kw.toUpperCase());
    let a = f.start;
    joins.forEach((j, i) => {
      one({ kind: i ? 'join' : 'from', label: i ? joinLabel(joins[i - 1]) : 'FROM', sql: `${prefix}select * from ${t.slice(f.body, j.index).trim()}` }, a, trimEnd(a, j.index));
      a = j.index;
    });
    const last = joins[joins.length - 1];
    one({ kind: last ? 'join' : 'from', label: last ? joinLabel(last) : 'FROM', sql: `${prefix}select * from ${body(f)}` }, a, f.end);
    if (cl.where) one({ kind: 'where', label: 'WHERE', sql: `${prefix}select * from ${body(f)}${txt(cl.where)}` }, cl.where.start, cl.where.end);
    if (cl['group by']) {
      const g = cl['group by'];
      // `group by 1, 2` means the first SELECT items: show those expressions.
      const items = c => {
        const list = [];
        let a = c.body;
        for (const k of [...topMatches(/(,)/g, m, c.body, c.end), { index: c.end }]) { list.push(t.slice(a, k.index).trim()); a = k.index + 1; }
        return list;
      };
      const picked = items(sel).map(s => s.replace(/^distinct\s+/i, '').replace(/\s+as\s+[\w$"]+$/i, ''));
      const keys = items(g).map(s => (/^\d+$/.test(s) && picked[s - 1] ? picked[s - 1] : s)).join(', ');
      const grouped = `${prefix}select ${keys}, count(*) as "${GROUP_COUNT_COLUMN}" from ${body(f)}${txt(cl.where)}${txt(g)}`;
      one({ kind: 'group', label: 'GROUP BY', sql: grouped }, g.start, g.end);
      if (cl.having) one({ kind: 'having', label: 'HAVING', sql: grouped + txt(cl.having) }, cl.having.start, cl.having.end);
    }
  }
  const selLabel = /^distinct\b/i.test(m.code.slice(sel.body).trimStart()) ? 'SELECT DISTINCT' : 'SELECT';
  if (cl.order) {
    one({ kind: 'select', label: selLabel, sql: t.slice(0, cl.order.start).trim() }, sel.start, sel.end);
    one({ kind: 'order', label: cl.order.kw.toUpperCase(), sql: t, real: true }, cl.order.start, t.length);
  } else one({ kind: 'select', label: selLabel, sql: t, real: true }, sel.start, sel.end);
  return steps;
}

export function planDebug(sql) {
  const stmts = splitStatements(sql);
  return stmts.flatMap((s, i) => planStatement(s.text).map(step => ({
    ...step, stmt: i + 1, stmtCount: stmts.length, range: [s.start + step.range[0], s.start + step.range[1]],
  })));
}

// Runs every planned step inside one transaction that is rolled back (unless
// `fresh`), so the database never changes. Clause steps run inside a
// savepoint each and are always undone; a failing statement ends the run,
// as it would in a real script. Scripts with their own BEGIN/COMMIT (or a
// fresh database) get statement steps only, since savepoints need a
// transaction this function controls.
export async function runDebug(db, sql, { seed = '', fresh = false } = {}) {
  const own = fresh || hasTxControl(sql);
  const plan = planDebug(sql).filter(s => s.real || !own);
  const steps = [];
  const undo = 'rollback to savepoint lx_debug; release savepoint lx_debug';
  const guarded = async q => {
    if (own) return runScript(db, q);
    await db.exec('savepoint lx_debug');
    try { const r = await runScript(db, q); await db.exec('release savepoint lx_debug'); return r; }
    catch (e) { await db.exec(undo); throw e; }
  };
  if (!fresh) await db.exec('begin');
  try {
    if (seed) await db.exec(seed);
    for (const s of plan) {
      const step = { ...s };
      steps.push(step);
      if (!s.real) {
        await db.exec('savepoint lx_debug');
        try { step.table = lastTable(await runScript(db, s.sql)); }
        catch (e) { step.note = e.message; }
        finally { await db.exec(undo); }
        continue;
      }
      try {
        const res = await guarded(s.sql);
        step.table = lastTable(res);
        step.affected = res.reduce((n, r) => n + (r.affectedRows || 0), 0);
      } catch (e) {
        step.error = e.message;
        break;
      }
      if (s.snapshot) {
        try { step.after = lastTable(await guarded(`select * from ${s.snapshot}`)); } catch { /* dropped or renamed */ }
      }
    }
  } finally {
    if (!fresh) {
      await db.exec('rollback').catch(() => {});
      await db.exec('reset role').catch(() => {});
    }
  }
  return { steps, total: plan.length };
}
