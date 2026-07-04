import { FAVICON_HREF, HTMX_JS, OVERRIDES_CSS, TABLER_CSS } from '../css-urls.js';

export function HtmxScripts() {
  return (
    <>
      <script src={HTMX_JS} />
      <script
        dangerouslySetInnerHTML={{
          __html: `document.body.addEventListener('htmx:configRequest', function (evt) {
  var meta = document.querySelector('meta[name="csrf-token"]');
  if (meta) evt.detail.headers['X-CSRF-Token'] = meta.getAttribute('content') || '';
});`,
        }}
      />
    </>
  );
}

export function EditorLayout({
  title,
  username,
  csrfToken,
  children,
}: {
  title: string;
  username: string;
  csrfToken: string;
  children: unknown;
}) {
  return (
    <html lang="en" data-bs-theme="dark">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        <link rel="icon" href={FAVICON_HREF} />
        <link rel="stylesheet" href={TABLER_CSS} />
        <link rel="stylesheet" href={OVERRIDES_CSS} />
        <meta name="csrf-token" content={csrfToken} />
      </head>
      <body class="d-flex flex-column">
        <div class="page">
          <header class="navbar navbar-expand-md d-print-none">
            <div class="container-xl">
              <h1 class="navbar-brand navbar-brand-autodark pe-0 pe-md-3 mb-0">
                <span class="navbar-brand-text">{title}</span>
              </h1>
              <div class="navbar-nav flex-row order-md-last ms-auto align-items-center">
                <div class="nav-item d-none d-md-flex me-3">
                  <span class="text-secondary">Signed in as {username}</span>
                </div>
                <form method="post" action="/logout" class="nav-item">
                  <input type="hidden" name="_csrf" value={csrfToken} />
                  <button type="submit" class="btn btn-outline-secondary">
                    Log out
                  </button>
                </form>
              </div>
            </div>
          </header>
          <div class="page-wrapper flex-fill">{children}</div>
        </div>
        <HtmxScripts />
      </body>
    </html>
  );
}

export function EditorBody({
  plugins,
  activeNamespace,
  panel,
}: {
  plugins: Array<{ namespace: string; title: string; enabled?: boolean }>;
  activeNamespace: string;
  panel: unknown;
}) {
  return (
    <>
      <aside class="navbar navbar-vertical">
        <div class="container-fluid">
          <div class="collapse navbar-collapse show" id="sidebar-menu">
            <ul class="navbar-nav pt-lg-3">
              <li class="nav-item">
                <span class="text-secondary text-uppercase small px-3 py-2 d-block">Modules</span>
              </li>
              {plugins.map((p) => (
                <li class="nav-item w-100">
                  <button
                    type="button"
                    class={`nav-link w-100 text-start${p.namespace === activeNamespace ? ' active' : ''}`}
                    hx-get={`/htmx/modules/${p.namespace}/panel`}
                    hx-target="#module-content"
                    hx-swap="innerHTML"
                    hx-on:click="this.closest('.navbar-nav').querySelectorAll('.nav-link').forEach(el => el.classList.remove('active')); this.classList.add('active')"
                  >
                    <span
                      class={`status-dot ${p.enabled === false ? 'status-muted' : 'status-green'}`}
                    />
                    <span>{p.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>
      <div class="page-body">
        <div class="container-xl py-4" id="module-content">
          {panel}
        </div>
      </div>
    </>
  );
}
