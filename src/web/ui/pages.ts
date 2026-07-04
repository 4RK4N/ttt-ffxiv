import type { SessionUser } from '../auth.js';
import { CLIENT_JS } from './client-script.js';
import { STYLES } from './styles.js';

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function appTitle(botName: string): string {
  return `${botName} Admin Interface`;
}

/** Login / access-denied page. `message` shows an error (e.g. not an admin). */
export function loginPage(botName: string, message?: string): string {
  const title = escapeHtml(appTitle(botName));
  const note = message ? `<p class="note">${escapeHtml(message)}</p>` : '';
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<style>${STYLES}</style>
</head><body>
  <div class="login-wrap">
    <div class="login-card">
      <h1>${title}</h1>
      <p>Sign in with Discord. Server administrators only.</p>
      ${note}
      <a class="btn" href="/login">Login with Discord</a>
    </div>
  </div>
</body></html>`;
}

/** Main editor shell. Data is loaded client-side from /api/modules. */
export function editorPage(botName: string, user: SessionUser, csrfToken: string): string {
  const title = escapeHtml(appTitle(botName));
  const csrf = escapeHtml(csrfToken);
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="csrf-token" content="${csrf}" />
<title>${title}</title>
<style>${STYLES}</style>
</head><body>
  <header>
    <h1>${title}</h1>
    <div style="display:flex;align-items:center;gap:14px;">
      <span class="who">Signed in as ${escapeHtml(user.username)}</span>
      <form method="post" action="/logout" style="margin:0;display:inline;">
        <input type="hidden" name="_csrf" value="${csrf}" />
        <button type="submit" class="logout" style="background:none;border:1px solid var(--border);cursor:pointer;font:inherit;">Log out</button>
      </form>
    </div>
  </header>
  <div id="app"><div class="loading">Loading modules...</div></div>
  <script>${CLIENT_JS}</script>
</body></html>`;
}
