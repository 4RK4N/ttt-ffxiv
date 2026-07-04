import type { EditorModule } from '../../plugin-types.js';
import type { PanelProps } from './context.js';
import { Field } from './Field.js';
import { EnabledToggle } from './ModuleSidebar.js';
import { isHtmxMigrated } from './migrated.js';

export function ModulePanel({ mod, ctx, expanded, status }: PanelProps) {
  if (!isHtmxMigrated(mod.namespace)) {
    return (
      <section class="module-panel" id={`htmx-panel-${mod.namespace}`}>
        <h2 class="mb-3">{mod.title}</h2>
        <p class="text-secondary">This module has not been migrated to the HTMX editor yet.</p>
      </section>
    );
  }

  const statusHtml = status ? (
    <span class={status.ok ? 'text-success' : 'text-danger'}>{status.message}</span>
  ) : (
    <span class="text-secondary" />
  );

  return (
    <section class="module-panel" data-ns={mod.namespace} id={`htmx-panel-${mod.namespace}`}>
      <form
        id={`panel-form-${mod.namespace}`}
        hx-put={`/htmx/modules/${mod.namespace}`}
        hx-target={`#htmx-panel-${mod.namespace}`}
        hx-swap="outerHTML"
      >
        <input type="hidden" name="_csrf" value={ctx.csrfToken} />
        <div class="d-flex justify-content-between align-items-start mb-3">
          <h2 class="mb-0">{mod.title}</h2>
          <EnabledToggle namespace={mod.namespace} enabled={mod.enabled !== false} />
        </div>
        {mod.description ? <p class="text-secondary mb-3">{mod.description}</p> : null}
        {mod.fields.map((f) => (
          <Field
            f={f}
            value={mod.values[f.key]}
            ctx={ctx}
            namespace={mod.namespace}
            expanded={expanded}
          />
        ))}
        <div class="d-flex align-items-center gap-2 mt-3">
          <button type="submit" class="btn btn-primary">
            Save
          </button>
          {statusHtml}
        </div>
      </form>
    </section>
  );
}

export function ModulePanelPartial(props: PanelProps) {
  return ModulePanel(props);
}

export type { EditorModule };
