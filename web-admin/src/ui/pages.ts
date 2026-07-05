import { ADMIN_CSS, FAVICON_HREF } from "./css-urls.js";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function loginPage(botName: string, message?: string): string {
  const title = escapeHtml(`${botName} Admin Interface`);
  const note = message
    ? `<div class="alert alert-error mb-4">${escapeHtml(message)}</div>`
    : "";
  return `<!doctype html>
<html lang="en" data-theme="dark"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<link rel="icon" href="${FAVICON_HREF}" />
<link rel="stylesheet" href="${ADMIN_CSS}" />
</head><body class="flex min-h-screen items-center justify-center bg-base-200 p-4">
  <div class="card w-full max-w-md bg-base-100 shadow-xl">
    <div class="card-body">
      <h1 class="card-title justify-center text-center">${title}</h1>
      <p class="text-center text-base-content/60">Sign in with Discord. Server administrators only.</p>
      ${note}
      <div class="card-actions justify-stretch">
        <a class="btn btn-primary w-full" href="/login">Login with Discord</a>
      </div>
    </div>
  </div>
</body></html>`;
}
