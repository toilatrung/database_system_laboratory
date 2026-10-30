// Serves the repository on http://localhost:4420 (opens index.html, the hub
// linking every part). Only needed if your browser blocks pages opened
// directly from disk.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { REPO } from './common.mjs';

const PORT = Number(process.env.PORT) || 4420;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.sql': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8', '.json': 'application/json' };

createServer(async (req, res) => {
  const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = path.join(REPO, url);
  if (url.endsWith('/')) file = path.join(file, url === '/' ? 'index.html' : 'playground.html');
  if (!file.startsWith(REPO) || file.includes('node_modules') || file.includes(`${path.sep}.`)) { res.writeHead(403).end(); return; }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' }).end(body);
  } catch {
    res.writeHead(404).end('Not found');
  }
}).listen(PORT, '127.0.0.1', () => console.log(`Practice Lab: http://localhost:${PORT}/`));
