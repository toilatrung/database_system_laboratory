// Online progress sync: one Redis hash on Upstash, field = localStorage key,
// value = JSON {v, t} (v = the stored string, null when deleted; t = ms timestamp).
// Each key keeps whichever write is newest, so several devices can share it.
// Access is guarded by middleware.js (passcode cookie) like every other path.
// Env: <PREFIX>_REST_API_URL + <PREFIX>_REST_API_TOKEN, set by the Vercel Upstash integration
// (prefix KV or STORAGE), or UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN.

export const config = { runtime: 'edge' };

const HASH = 'cs4420:sync';
const KEY_RE = /^cs4420[\w:.~-]{0,200}$/;
const MAX_VALUE = 256 * 1024;
const MAX_KEYS = 500;

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});

function redis() {
  const env = process.env;
  const url = env.KV_REST_API_URL || env.STORAGE_REST_API_URL || env.UPSTASH_REDIS_REST_URL;
  const token = env.KV_REST_API_TOKEN || env.STORAGE_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return async commands => {
    const res = await fetch(url.replace(/\/$/, '') + '/pipeline', {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify(commands),
    });
    if (!res.ok) throw new Error(`Upstash ${res.status}: ${await res.text()}`);
    const out = await res.json();
    const failed = out.find(r => r.error);
    if (failed) throw new Error(`Upstash: ${failed.error}`);
    return out.map(r => r.result);
  };
}

const parse = raw => { try { return JSON.parse(raw); } catch { return null; } };

export default async function handler(request) {
  const run = redis();
  if (!run) return json({ error: 'not-configured' }, 503);

  try {
    if (request.method === 'GET') {
      const [flat] = await run([['HGETALL', HASH]]);
      const data = {};
      for (let i = 0; i + 1 < flat.length; i += 2) {
        const entry = parse(flat[i + 1]);
        if (entry) data[flat[i]] = entry;
      }
      return json({ data });
    }

    if (request.method === 'POST') {
      const body = await request.json().catch(() => null);
      const changes = body && typeof body.changes === 'object' && body.changes;
      if (!changes) return json({ error: 'bad-request' }, 400);
      const keys = Object.keys(changes);
      if (keys.length > MAX_KEYS) return json({ error: 'too-many-keys' }, 413);
      for (const k of keys) {
        const c = changes[k];
        if (!KEY_RE.test(k) || !c || !Number.isFinite(c.t) || !(c.v === null || typeof c.v === 'string')) return json({ error: 'bad-entry', key: k }, 400);
        if (c.v && c.v.length > MAX_VALUE) return json({ error: 'value-too-large', key: k }, 413);
      }
      if (!keys.length) return json({ ok: true, applied: 0 });

      // Keep the newest write per key; an older one (from a device that was offline) is dropped.
      const [current] = await run([['HMGET', HASH, ...keys]]);
      const set = [];
      keys.forEach((k, i) => {
        const old = current[i] && parse(current[i]);
        if (!old || changes[k].t >= old.t) set.push(k, JSON.stringify({ v: changes[k].v, t: changes[k].t }));
      });
      if (set.length) await run([['HSET', HASH, ...set]]);
      return json({ ok: true, applied: set.length / 2 });
    }

    return json({ error: 'method-not-allowed' }, 405);
  } catch (err) {
    console.error(err);
    return json({ error: 'upstream' }, 502);
  }
}
