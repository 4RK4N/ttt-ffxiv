/** Matches store readEnabled: only explicit false is off. */
export function isModuleEnabled(enabled: boolean | undefined): boolean {
  return enabled !== false;
}

const REVERT_CHECKBOX_ON_HTMX_ERROR =
  "var c=this.checked;this.checked=!c;this.closest('label').querySelector('.form-check-label').textContent=this.checked?'On':'Off'";

export function StatusDot({
  namespace,
  enabled,
  oob,
}: {
  namespace: string;
  enabled: boolean | undefined;
  oob?: boolean;
}) {
  const on = isModuleEnabled(enabled);
  return (
    <span
      id={`status-dot-${namespace}`}
      class={`status-dot ${on ? 'status-green' : 'status-muted'}`}
      {...(oob ? { 'hx-swap-oob': 'true' } : {})}
    />
  );
}

export function EnabledToggle({
  namespace,
  enabled,
}: {
  namespace: string;
  enabled: boolean | undefined;
}) {
  const on = isModuleEnabled(enabled);
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
          hx-on:response-error={REVERT_CHECKBOX_ON_HTMX_ERROR}
          hx-on:send-error={REVERT_CHECKBOX_ON_HTMX_ERROR}
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
  return (
    <>
      <EnabledToggle namespace={namespace} enabled={enabled} />
      <StatusDot namespace={namespace} enabled={enabled} oob />
    </>
  );
}
