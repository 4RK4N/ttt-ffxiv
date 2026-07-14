import type { EditorModule } from "../../plugin-types.js";
import type { PanelProps } from "./context.js";
import { Field } from "./Field.js";
import { EnabledToggle } from "./enabled-ui.js";

export function ModulePanel({ mod, ctx, expanded, status }: PanelProps) {
  const statusHtml = status ? (
    <span class={status.ok ? "text-success" : "text-error"}>
      {status.message}
    </span>
  ) : (
    <span class="text-base-content/40" />
  );

  return (
    <section
      class="module-panel"
      data-ns={mod.namespace}
      id={`htmx-panel-${mod.namespace}`}
    >
      <form id={`panel-form-${mod.namespace}`}>
        <input type="hidden" name="_csrf" value={ctx.csrfToken} />
        <div class="mb-3 flex items-center justify-between gap-3">
          <h2 class="text-2xl font-semibold">{mod.title}</h2>
          <EnabledToggle namespace={mod.namespace} enabled={mod.enabled} />
        </div>
        {mod.description ? (
          <p class="mb-3 text-base-content/60">{mod.description}</p>
        ) : null}
        {mod.fields.map((f) => (
          <Field
            f={f}
            value={mod.values[f.key]}
            ctx={ctx}
            namespace={mod.namespace}
            expanded={expanded}
          />
        ))}
        <div class="mt-3 flex items-center gap-2">
          <button
            type="submit"
            class="btn btn-primary"
            hx-put={`/htmx/modules/${mod.namespace}`}
            hx-target={`#htmx-panel-${mod.namespace}`}
            hx-swap="outerHTML"
            hx-include={`#panel-form-${mod.namespace}`}
            hx-disabled-elt="this"
          >
            Save
            <span class="htmx-indicator loading loading-spinner loading-sm" />
          </button>
          {statusHtml}
        </div>
      </form>
    </section>
  );
}

export type { EditorModule };
