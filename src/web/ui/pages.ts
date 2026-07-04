import type { SessionUser } from '../auth.js';
import { CLIENT_JS } from './client-script.js';

const TABLER_CSS = '/assets/css/tabler.min.css';
const OVERRIDES_CSS = '/assets/css/admin-overrides.css';

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

function adminHead(title: string, extra = ''): string {
  return `<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<link rel="stylesheet" href="${TABLER_CSS}" />
<link rel="stylesheet" href="${OVERRIDES_CSS}" />
${extra}`;
}

/** Login / access-denied page. `message` shows an error (e.g. not an admin). */
export function loginPage(botName: string, message?: string): string {
  const title = escapeHtml(appTitle(botName));
  const note = message ? `<div class="alert alert-danger">${escapeHtml(message)}</div>` : '';
  return `<!doctype html>
<html lang="en" data-bs-theme="dark"><head>
${adminHead(title)}
</head><body class="d-flex flex-column">
  <div class="page page-center">
    <div class="container container-tight py-4">
      <div class="card card-md">
        <div class="card-body">
          <h1 class="card-title text-center mb-2">${title}</h1>
          <p class="text-secondary text-center mb-4">Sign in with Discord. Server administrators only.</p>
          ${note}
          <a class="btn btn-primary w-100" href="/login">Login with Discord</a>
        </div>
      </div>
    </div>
  </div>
</body></html>`;
}

/** Main editor shell. Data is loaded client-side from /api/modules. */
export function editorPage(botName: string, user: SessionUser, csrfToken: string): string {
  const title = escapeHtml(appTitle(botName));
  const csrf = escapeHtml(csrfToken);
  return `<!DOCTYPE html>
<html lang="en" data-bs-theme="dark"><head>
${adminHead(title, `<meta name="csrf-token" content="${csrf}" />`)}
</head><body class="d-flex flex-column">
  <div class="page">
    <header class="navbar navbar-expand-md d-print-none">
      <div class="container-xl">
        <h1 class="navbar-brand navbar-brand-autodark pe-0 pe-md-3 mb-0">
          <span class="navbar-brand-text">${title}</span>
        </h1>
        <div class="navbar-nav flex-row order-md-last ms-auto align-items-center">
          <div class="nav-item d-none d-md-flex me-3">
            <span class="text-secondary">Signed in as ${escapeHtml(user.username)}</span>
          </div>
          <form method="post" action="/logout" class="nav-item">
            <input type="hidden" name="_csrf" value="${csrf}" />
            <button type="submit" class="btn btn-outline-secondary">Log out</button>
          </form>
        </div>
      </div>
    </header>
    <div id="app" class="page-wrapper flex-fill">
      <div class="text-secondary text-center py-5 w-100">Loading modules…</div>
    </div>
  </div>
  <script>${CLIENT_JS}</script>
</body></html>`;
}
