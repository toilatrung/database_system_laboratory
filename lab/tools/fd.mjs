// Functional-dependency toolkit (Chapter 7): attribute closure, candidate keys,
// canonical cover, BCNF / 3NF tests and decompositions, lossless-join and
// dependency-preservation tests. Pure functions, no imports — inlined into
// playground.html by build.mjs and imported by the Node tests.
//
// Attributes are strings. Sets are arrays kept in schema order. Input syntax:
//   schema "ABCDE" (one letter each) or "ID, name, dept_name" (comma separated)
//   FDs one per line or separated by ";":  "A -> BC", "CD → E", "ID, x -> name"

export function fdParseAttrs(text, letters) {
  const s = String(text).trim();
  if (!s) return [];
  if (letters) return [...s.replace(/[\s,{}()]/g, '')];
  return s.replace(/[{}()]/g, '').split(/[,\s]+/).filter(Boolean);
}

// Single-letter mode when the schema has no separators (e.g. "ABCDE").
export function fdLetterMode(schemaText) {
  return !/[,\s]/.test(String(schemaText).trim().replace(/^[{(]|[)}]$/g, ''));
}

export function fdParse(schemaText, fdText) {
  const letters = fdLetterMode(schemaText);
  const R = [...new Set(fdParseAttrs(schemaText, letters))];
  const errors = [];
  const fds = [];
  String(fdText).split(/[\n;]+/).map(l => l.trim()).filter(Boolean).forEach(line => {
    const m = line.split(/\s*(?:->|→|=>)\s*/);
    if (m.length !== 2) { errors.push(`Không đọc được "${line}" (cần dạng A -> B).`); return; }
    const lhs = [...new Set(fdParseAttrs(m[0], letters))];
    const rhs = [...new Set(fdParseAttrs(m[1], letters))];
    const unknown = [...lhs, ...rhs].filter(a => !R.includes(a));
    if (!lhs.length || !rhs.length) errors.push(`"${line}" thiếu vế trái hoặc vế phải.`);
    else if (unknown.length) errors.push(`"${line}": thuộc tính ${[...new Set(unknown)].join(', ')} không có trong R.`);
    else fds.push({ lhs, rhs });
  });
  return { R, fds, letters, errors };
}

const order = (R, xs) => R.filter(a => xs.includes(a));
const union = (R, ...sets) => order(R, [...new Set(sets.flat())]);
const minus = (a, b) => a.filter(x => !b.includes(x));
const subset = (a, b) => a.every(x => b.includes(x));
const same = (a, b) => a.length === b.length && subset(a, b);

export function fdFormat(attrs, letters) {
  if (!attrs.length) return '∅';
  return letters ? attrs.join('') : attrs.join(', ');
}
export function fdFormatFD(fd, letters) {
  return `${fdFormat(fd.lhs, letters)} → ${fdFormat(fd.rhs, letters)}`;
}

// α⁺ under fds, with the FDs used in order (textbook algorithm, Figure 7.8).
export function fdClosure(R, fds, alpha) {
  let result = order(R, alpha);
  const steps = [];
  let changed = true;
  while (changed) {
    changed = false;
    for (const fd of fds) {
      if (subset(fd.lhs, result) && !subset(fd.rhs, result)) {
        const added = minus(fd.rhs, result);
        result = union(R, result, fd.rhs);
        steps.push({ fd, added, result });
        changed = true;
      }
    }
  }
  return { result, steps };
}

export const fdIsSuperkey = (R, fds, K) => subset(R, fdClosure(R, fds, K).result);

function* subsetsOfSize(items, k, start = 0, acc = []) {
  if (acc.length === k) { yield acc; return; }
  for (let i = start; i <= items.length - (k - acc.length); i++) yield* subsetsOfSize(items, k, i + 1, [...acc, items[i]]);
}

// Candidate keys by increasing size. Attributes that never appear on a right
// side belong to every key; attributes only on right sides belong to none.
export function fdCandidateKeys(R, fds) {
  const onRight = new Set(fds.flatMap(f => minus(f.rhs, f.lhs)));
  const onLeft = new Set(fds.flatMap(f => f.lhs));
  const core = R.filter(a => !onRight.has(a));
  const optional = R.filter(a => onRight.has(a) && onLeft.has(a));
  const keys = [];
  for (let k = 0; k <= optional.length; k++) {
    for (const extra of subsetsOfSize(optional, k)) {
      const K = order(R, [...core, ...extra]);
      if (keys.some(key => subset(key, K))) continue;
      if (fdIsSuperkey(R, fds, K)) keys.push(K);
    }
  }
  return keys;
}

// Canonical cover with a log of every change (slides 7.48–7.50): merge equal
// left sides, then delete one extraneous attribute at a time (Exercise 7.15
// shows why deleting two at once is wrong) until nothing changes.
export function fdCover(R, fds, letters) {
  const fa = xs => fdFormat(xs, letters);
  const ff = f => fdFormatFD(f, letters);
  let F = fds.map(f => ({ lhs: [...f.lhs], rhs: [...f.rhs] }));
  const log = [];
  const mergeLeft = () => {
    const merged = [];
    for (const f of F) {
      const g = merged.find(x => same(x.lhs, f.lhs));
      if (g) {
        log.push(`Hợp (union rule): ${ff(g)} và ${ff(f)} → ${ff({ lhs: g.lhs, rhs: union(R, g.rhs, f.rhs) })}`);
        g.rhs = union(R, g.rhs, f.rhs);
      } else merged.push({ lhs: [...f.lhs], rhs: [...f.rhs] });
    }
    F = merged;
  };
  const step = () => {
    for (let i = 0; i < F.length; i++) {
      const f = F[i];
      // Left side: A ∈ α is extraneous if (α − A)⁺ under F contains β.
      if (f.lhs.length > 1) {
        for (const A of f.lhs) {
          const rest = minus(f.lhs, [A]);
          if (subset(f.rhs, fdClosure(R, F, rest).result)) {
            log.push(`${A} thừa ở vế trái của ${ff(f)}: (${fa(rest)})⁺ dưới F chứa ${fa(f.rhs)} → thay bằng ${ff({ lhs: rest, rhs: f.rhs })}`);
            F[i] = { lhs: rest, rhs: f.rhs };
            return true;
          }
        }
      }
      // Right side: A ∈ β is extraneous if α⁺ under F' (A removed from β) contains A.
      for (const A of f.rhs) {
        const reduced = { lhs: f.lhs, rhs: minus(f.rhs, [A]) };
        const Fp = F.map((g, j) => (j === i ? reduced : g)).filter(g => g.rhs.length);
        if (fdClosure(R, Fp, f.lhs).result.includes(A)) {
          log.push(`${A} thừa ở vế phải của ${ff(f)}: (${fa(f.lhs)})⁺ dưới F' (đã bỏ ${A}) vẫn chứa ${A} → ${reduced.rhs.length ? ff(reduced) : 'xoá FD này'}`);
          F = Fp;
          return true;
        }
      }
    }
    return false;
  };
  do mergeLeft(); while (step());
  return { cover: F, log };
}

// A BCNF violation on schema Ri (using F⁺ restricted to Ri): a set α ⊆ Ri
// with α⁺ ∩ Ri ⊋ α and α⁺ ⊉ Ri. Small schemas only (exponential search).
export function fdBcnfViolation(R, fds, Ri) {
  for (let k = 1; k < Ri.length; k++) {
    for (const alpha of subsetsOfSize(Ri, k)) {
      const cl = fdClosure(R, fds, alpha).result;
      const beta = minus(order(Ri, cl), alpha);
      if (beta.length && !subset(Ri, cl)) return { lhs: alpha, rhs: beta };
    }
  }
  return null;
}

// BCNF decomposition (slide 7.57): replace Ri by (Ri − β) and (α ∪ β).
export function fdBcnfDecompose(R, fds) {
  let result = [order(R, R)];
  const steps = [];
  for (let guard = 0; guard < 50; guard++) {
    const idx = result.findIndex(Ri => fdBcnfViolation(R, fds, Ri));
    if (idx < 0) break;
    const Ri = result[idx];
    const v = fdBcnfViolation(R, fds, Ri);
    const r1 = union(R, v.lhs, v.rhs);
    const r2 = minus(Ri, v.rhs);
    steps.push({ schema: Ri, fd: v, r1, r2 });
    result.splice(idx, 1, r1, r2);
  }
  return { result, steps };
}

// 3NF test on the original schema: for each α → A (A ∉ α) in F, α is a
// superkey or A is prime (in some candidate key).
export function fdThirdNFViolations(R, fds, keys) {
  const prime = new Set((keys || fdCandidateKeys(R, fds)).flat());
  const out = [];
  for (const f of fds) {
    if (fdIsSuperkey(R, fds, f.lhs)) continue;
    const bad = minus(f.rhs, f.lhs).filter(a => !prime.has(a));
    if (bad.length) out.push({ lhs: f.lhs, rhs: bad });
  }
  return out;
}

export function fdBcnfViolations(R, fds) {
  return fds.filter(f => minus(f.rhs, f.lhs).length && !fdIsSuperkey(R, fds, f.lhs));
}

// 3NF synthesis (slide 7.63) from the canonical cover.
export function fdThirdNFDecompose(R, fds, letters) {
  const { cover } = fdCover(R, fds, letters);
  const schemas = [];
  const steps = [];
  for (const f of cover) {
    const s = union(R, f.lhs, f.rhs);
    if (schemas.some(x => subset(s, x))) steps.push({ kind: 'skip', fd: f, schema: s });
    else { schemas.push(s); steps.push({ kind: 'add', fd: f, schema: s }); }
  }
  const keys = fdCandidateKeys(R, fds);
  if (!schemas.some(s => keys.some(k => subset(k, s)))) {
    schemas.push(keys[0]);
    steps.push({ kind: 'key', schema: keys[0] });
  }
  // Remove schemas contained in another one.
  const result = schemas.filter((s, i) => !schemas.some((t, j) => j !== i && subset(s, t) && (!same(s, t) || j < i)));
  schemas.filter(s => !result.includes(s)).forEach(s => steps.push({ kind: 'drop', schema: s }));
  return { cover, keys, result, steps };
}

// Lossless test for a binary decomposition: R1 ∩ R2 → R1 or R1 ∩ R2 → R2.
export function fdLosslessBinary(R, fds, R1, R2) {
  const common = R1.filter(a => R2.includes(a));
  const cl = fdClosure(R, fds, common).result;
  return { common, closure: cl, lossless: subset(R1, cl) || subset(R2, cl) };
}

// General lossless test (chase / tableau) for any number of schemas.
export function fdLosslessChase(R, fds, schemas) {
  const rows = schemas.map((S, i) => R.map(a => (S.includes(a) ? `a:${a}` : `b${i}:${a}`)));
  let changed = true;
  while (changed) {
    changed = false;
    for (const f of fds) {
      const li = f.lhs.map(a => R.indexOf(a));
      for (let x = 0; x < rows.length; x++) {
        for (let y = x + 1; y < rows.length; y++) {
          if (!li.every(i => rows[x][i] === rows[y][i])) continue;
          for (const a of f.rhs) {
            const i = R.indexOf(a);
            const u = rows[x][i], v = rows[y][i];
            if (u === v) continue;
            const keep = u.startsWith('a:') ? u : v.startsWith('a:') ? v : u < v ? u : v;
            const drop = keep === u ? v : u;
            for (const r of rows) for (let j = 0; j < r.length; j++) if (r[j] === drop) r[j] = keep;
            changed = true;
          }
        }
      }
    }
  }
  return rows.some(r => r.every(v => v.startsWith('a:')));
}

// Dependency preservation without computing F⁺ (slide 7.53).
export function fdPreserved(R, fds, schemas, f) {
  let result = [...f.lhs];
  let changed = true;
  while (changed) {
    changed = false;
    for (const Ri of schemas) {
      const t = order(Ri, fdClosure(R, fds, result.filter(a => Ri.includes(a))).result);
      const next = union(R, result, t);
      if (next.length > result.length) { result = next; changed = true; }
    }
  }
  return subset(f.rhs, result);
}

export function fdParseSchemas(text, letters, R) {
  return String(text).split(/[\n;|]+/).map(s => s.replace(/^\s*R\d*\s*=\s*/i, '').trim()).filter(Boolean)
    .map(s => order(R, [...new Set(fdParseAttrs(s, letters))]));
}
