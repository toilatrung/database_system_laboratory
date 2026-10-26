// Vercel Routing Middleware: every request must carry a valid session cookie,
// otherwise the visitor gets a passcode page. The passcode comes from the
// PERSONAL_PASSCODE environment variable (Vercel → Settings → Environment Variables).
// The cookie has no Max-Age, so it disappears when the browser closes and the
// passcode is asked again on the next visit.

const DEFAULT_PASSCODE = '230303';
const COOKIE = 'pc_session';
const LOGIN_PATH = '/__passcode';

export const config = { matcher: '/:path*' };

const passcode = () => (process.env.PERSONAL_PASSCODE || DEFAULT_PASSCODE).trim();

// Cookie value = SHA-256 of the passcode, so changing the passcode logs everyone out.
async function token(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('cs4420:' + value));
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function readCookie(request, name) {
  const header = request.headers.get('cookie') || '';
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return v.join('=');
  }
  return null;
}

// Only allow same-site relative redirects after login.
const safeNext = next => (typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') ? next : '/');

const escapeHtml = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function loginPage(next, error) {
  const html = `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>CS4420 Practice Lab</title>
<style>
  :root { --canvas: #f6f7f9; --surface: #fff; --border: #e3e6ea; --ink: #1a1d23; --ink-muted: #6b7280;
    --primary: #1f2933; --on-primary: #fff; --danger: #b42318; color-scheme: light; }
  @media (prefers-color-scheme: dark) {
    :root { --canvas: #0f1115; --surface: #171a21; --border: #2a2f3a; --ink: #e6e8ec; --ink-muted: #9aa1ad;
      --primary: #e6e8ec; --on-primary: #111; --danger: #f97066; color-scheme: dark; }
  }
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 16px;
    background: var(--canvas); color: var(--ink); font: 400 14px/20px system-ui, -apple-system, "Segoe UI", sans-serif; }
  form { width: 100%; max-width: 340px; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 24px; }
  h1 { margin: 0 0 4px; font-size: 18px; line-height: 24px; font-weight: 600; }
  p { margin: 0 0 16px; color: var(--ink-muted); }
  input { width: 100%; height: 40px; padding: 0 12px; border: 1px solid var(--border); border-radius: 6px;
    background: transparent; color: var(--ink); font: 500 16px/1 ui-monospace, Consolas, monospace; letter-spacing: .2em; }
  input:focus { outline: 2px solid var(--primary); outline-offset: 1px; }
  button { width: 100%; height: 40px; margin-top: 12px; border: 0; border-radius: 6px; cursor: pointer;
    background: var(--primary); color: var(--on-primary); font: inherit; font-weight: 600; }
  .error { margin: 12px 0 0; color: var(--danger); }
</style>
</head>
<body>
<form method="post" action="${LOGIN_PATH}">
  <h1>CS4420 Practice Lab</h1>
  <p>Nhập mật khẩu để truy cập.</p>
  <input type="password" name="passcode" inputmode="numeric" autocomplete="current-password" autofocus required aria-label="Mật khẩu">
  <input type="hidden" name="next" value="${escapeHtml(next)}">
  <button type="submit">Vào</button>
  ${error ? '<p class="error" role="alert">Sai mật khẩu, thử lại.</p>' : ''}
</form>
</body>
</html>`;
  return new Response(html, {
    status: 401,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
  });
}

export default async function middleware(request) {
  const url = new URL(request.url);
  const expected = await token(passcode());

  if (url.pathname === LOGIN_PATH && request.method === 'POST') {
    const form = await request.formData();
    const next = safeNext(form.get('next'));
    if (await token(String(form.get('passcode') || '').trim()) !== expected) return loginPage(next, true);
    return new Response(null, {
      status: 303,
      headers: {
        location: next,
        'set-cookie': `${COOKIE}=${expected}; Path=/; HttpOnly; Secure; SameSite=Lax`,
        'cache-control': 'no-store',
      },
    });
  }

  if (readCookie(request, COOKIE) === expected) return; // authorized: continue to the static file

  return loginPage(url.pathname === LOGIN_PATH ? '/' : url.pathname + url.search, false);
}
