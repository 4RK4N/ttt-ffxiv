import { OVERRIDES_CSS, TABLER_CSS_CDN, TABLER_CSS_LOCAL } from './css-urls.js';

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function loginPage(botName: string, message?: string): string {
  const title = escapeHtml(`${botName} Admin Interface`);
  const note = message ? `<div class="alert alert-danger">${escapeHtml(message)}</div>` : '';
  return `<!doctype html>
<html lang="en" data-bs-theme="dark"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<link rel="stylesheet" href="${TABLER_CSS_LOCAL}" />
<link rel="stylesheet" href="${TABLER_CSS_CDN}" crossorigin="anonymous" />
<link rel="stylesheet" href="${OVERRIDES_CSS}" />
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
