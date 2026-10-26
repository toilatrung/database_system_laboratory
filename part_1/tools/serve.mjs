// Serves the project folder on http://localhost:4420 (opens playground.html).
// Only needed if your browser blocks pages opened directly from disk.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT) || 4420;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.sql': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8', '.json': 'application/json' };

createServer(async (req, res) => {
  const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const file = path.join(ROOT, url === '/' ? 'playground.html' : url);
  if (!file.startsWith(ROOT) || file.includes('node_modules')) { res.writeHead(403).end(); return; }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' }).end(body);
  } catch {
    res.writeHead(404).end('Not found');
  }
}).listen(PORT, '127.0.0.1', () => console.log(`Playground: http://localhost:${PORT}/`));
