import type { WebPlugin } from '../../plugin-types.js';

export function StatusDot({
  namespace,
  enabled,
  oob,
}: {
  namespace: string;
  enabled: boolean;
  oob?: boolean;
}) {
  return (
    <span
      id={`status-dot-${namespace}`}
      class={`status-dot ${enabled ? 'status-green' : 'status-muted'}`}
      {...(oob ? { 'hx-swap-oob': 'true' } : {})}
    />
  );
}

export function ModuleSidebar({
  plugins,
  activeNamespace,
}: {
  plugins: WebPlugin[];
  activeNamespace: string;
}) {
  return (
    <aside class="navbar navbar-vertical navbar-expand-lg">
      <div class="container-fluid">
        <div class="navbar-nav pt-lg-3">
          <div class="text-secondary text-uppercase small px-3 py-2">Modules</div>
          {plugins.map((p) => {
            const enabled = true;
            return (
              <button
                type="button"
                class={`nav-link w-100 text-start${p.namespace === activeNamespace ? ' active' : ''}`}
                hx-get={`/htmx/modules/${p.namespace}/panel`}
                hx-target="#module-content"
                hx-swap="innerHTML"
                hx-on:click="this.closest('.navbar-nav').querySelectorAll('.nav-link').forEach(el => el.classList.remove('active')); this.classList.add('active')"
              >
                <StatusDot namespace={p.namespace} enabled={enabled} />
                <span>{p.title}</span>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

export function PlaceholderPanel({ title }: { title: string }) {
  return (
    <section class="module-panel">
      <h2 class="mb-3">{title}</h2>
      <p class="text-secondary">This module has not been migrated to the HTMX editor yet.</p>
    </section>
  );
}

export function EnabledToggle({
  namespace,
  enabled,
}: {
  namespace: string;
  enabled: boolean;
}) {
  const on = enabled !== false;
  const toggleId = `enabled-toggle-${namespace}`;
  return (
    <div id={toggleId}>
      <label class="form-check form-switch mb-0">
        <input
          class="form-check-input"
          type="checkbox"
          name="enabled"
          value="true"
          checked={on}
          hx-put={`/htmx/modules/${namespace}/enabled`}
          hx-trigger="change"
          hx-target={`#${toggleId}`}
          hx-swap="outerHTML"
          hx-include="this"
        />
        <span class="form-check-label">{on ? 'On' : 'Off'}</span>
      </label>
    </div>
  );
}

/** HTMX response fragment: re-render toggle + OOB sidebar status dot. */
export function EnabledToggleResponse({
  namespace,
  enabled,
}: {
  namespace: string;
  enabled: boolean;
}) {
  const on = enabled === true;
  return (
    <>
      <EnabledToggle namespace={namespace} enabled={on} />
      <StatusDot namespace={namespace} enabled={on} oob />
    </>
  );
}
