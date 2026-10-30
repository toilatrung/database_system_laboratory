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
export async function produceTable(db, sql, check, fresh) {
  if (fresh) {
    const results = await runScript(db, sql);
    const table = check ? lastTable(await runScript(db, check)) : lastTable(results);
    return normalizeTable(table);
  }
  await db.exec('begin');
  try {
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
    try { return await produceTable(db, sql, ex.check, ex.fresh); }
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
