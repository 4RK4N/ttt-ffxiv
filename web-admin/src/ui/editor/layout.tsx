import { ADMIN_CSS, ADMIN_JS, FAVICON_HREF, HTMX_JS } from "../css-urls.js";
import { StatusDot } from "./enabled-ui.js";

export function EditorLayout({
  title,
  username,
  csrfToken,
  plugins,
  activeNamespace,
  panel,
}: {
  title: string;
  username: string;
  csrfToken: string;
  plugins: Array<{ namespace: string; title: string; enabled?: boolean }>;
  activeNamespace: string;
  panel: unknown;
}) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        <link rel="icon" href={FAVICON_HREF} />
        <link rel="stylesheet" href={ADMIN_CSS} />
        <meta name="csrf-token" content={csrfToken} />
      </head>
      <body>
        <div class="drawer lg:drawer-open">
          <input
            id="admin-drawer"
            type="checkbox"
            class="drawer-toggle"
            tabindex="-1"
            aria-label="Module menu"
          />
          <div class="drawer-content flex min-h-screen flex-col bg-base-100">
            <header class="navbar border-b border-base-300 bg-base-200 px-2">
              <div class="flex-none lg:hidden">
                <button
                  type="button"
                  id="admin-drawer-open"
                  class="btn btn-square btn-ghost drawer-button"
                  aria-label="Open module menu"
                  aria-controls="admin-drawer-panel"
                  aria-expanded="false"
                >
                  ☰
                </button>
              </div>
              <div class="flex-1">
                <span class="text-lg font-semibold">{title}</span>
              </div>
              <div class="flex items-center gap-3">
                <span class="hidden text-base-content/60 md:inline">
                  Signed in as {username}
                </span>
                <form method="post" action="/logout">
                  <input type="hidden" name="_csrf" value={csrfToken} />
                  <button type="submit" class="btn btn-ghost btn-sm">
                    Log out
                  </button>
                </form>
              </div>
            </header>
            <main
              class="container mx-auto max-w-7xl flex-1 p-4"
              id="module-content"
            >
              {panel}
            </main>
          </div>
          <div class="drawer-side z-40">
            <label
              for="admin-drawer"
              class="drawer-overlay"
              aria-label="Close module menu"
            />
            <aside
              id="admin-drawer-panel"
              class="flex min-h-full w-60 flex-col border-r border-base-300 bg-base-200"
              aria-label="Modules"
            >
              <div class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-base-content/60">
                Modules
              </div>
              <ul class="menu menu-vertical w-full gap-1 px-2 pb-4">
                {plugins.map((p) => (
                  <li>
                    <button
                      type="button"
                      class={`justify-start${p.namespace === activeNamespace ? " menu-active" : ""}`}
                      hx-get={`/htmx/modules/${p.namespace}/panel`}
                      hx-target="#module-content"
                      hx-swap="innerHTML"
                      hx-indicator="find .loading"
                      hx-on:click="this.closest('.menu').querySelectorAll('button').forEach(el => el.classList.remove('menu-active')); this.classList.add('menu-active')"
                    >
                      <StatusDot namespace={p.namespace} enabled={p.enabled} />
                      <span>{p.title}</span>
                      <span class="loading loading-spinner loading-xs htmx-indicator ml-auto" />
                    </button>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </div>
        <script src={HTMX_JS} defer />
        <script src={ADMIN_JS} defer />
      </body>
    </html>
  );
}
