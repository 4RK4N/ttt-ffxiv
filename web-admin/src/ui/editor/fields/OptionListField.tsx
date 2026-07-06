import type { WebPluginSubField } from "../../../plugin-types.js";
import type { EditorContext } from "../context.js";
import { SubField } from "../Field.js";
import { fieldValueStr } from "./shared.js";

function OptionListRows({
  f,
  name,
  items,
  ctx,
  namespace,
  fieldKey,
  rowIndex,
  disabled,
  listId,
}: {
  f: WebPluginSubField;
  name: string;
  items: Record<string, unknown>[];
  ctx: EditorContext;
  namespace: string;
  fieldKey: string;
  rowIndex: number;
  disabled?: boolean;
  listId: string;
}) {
  return (
    <>
      {items.map((item, optIndex) => (
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body">
            <input
              type="hidden"
              name={`${name}[${optIndex}].id`}
              value={fieldValueStr(item.id)}
            />
            {(f.optionFields ?? []).map((sub) => (
              <SubField
                f={sub}
                value={item[sub.key]}
                name={`${name}[${optIndex}].${sub.key}`}
                ctx={ctx}
                disabled={disabled}
              />
            ))}
            <button
              type="button"
              class="btn btn-outline btn-error btn-sm mt-2"
              hx-post={`/htmx/modules/${namespace}/list/${fieldKey}/option/${f.key}/remove/${rowIndex}/${optIndex}`}
              hx-include={`#panel-form-${namespace}`}
              hx-target={`#${listId}`}
              hx-swap="innerHTML"
              disabled={disabled}
            >
              Remove
            </button>
          </div>
        </div>
      ))}
    </>
  );
}

export function OptionListField({
  f,
  value,
  name,
  ctx,
  namespace,
  fieldKey,
  rowIndex,
  disabled,
}: {
  f: WebPluginSubField;
  value: unknown;
  name: string;
  ctx: EditorContext;
  namespace: string;
  fieldKey: string;
  rowIndex: number;
  disabled?: boolean;
}) {
  const items = (Array.isArray(value) ? value : []) as Record<
    string,
    unknown
  >[];
  const listId = `optlist-${namespace}-${fieldKey}-${rowIndex}-${f.key}`;

  return (
    <div class={`field mb-4 w-full${disabled ? " disabled" : ""}`}>
      <label class="label py-0">
        <span class="label-text font-medium">{f.label}</span>
      </label>
      {f.help ? (
        <p class="mb-1 text-sm text-base-content/60">{f.help}</p>
      ) : null}
      <div class="flex flex-col gap-3" id={listId}>
        <OptionListRows
          f={f}
          name={name}
          items={items}
          ctx={ctx}
          namespace={namespace}
          fieldKey={fieldKey}
          rowIndex={rowIndex}
          disabled={disabled}
          listId={listId}
        />
      </div>
      <button
        type="button"
        class="btn btn-sm mt-2"
        hx-post={`/htmx/modules/${namespace}/list/${fieldKey}/option/${f.key}/add/${rowIndex}`}
        hx-include={`#panel-form-${namespace}`}
        hx-target={`#${listId}`}
        hx-swap="innerHTML"
        disabled={disabled}
      >
        Add option
      </button>
    </div>
  );
}

export function OptionListRowsOnly({
  f,
  name,
  items,
  ctx,
  namespace,
  fieldKey,
  rowIndex,
  disabled,
}: {
  f: WebPluginSubField;
  name: string;
  items: Record<string, unknown>[];
  ctx: EditorContext;
  namespace: string;
  fieldKey: string;
  rowIndex: number;
  disabled?: boolean;
}) {
  const listId = `optlist-${namespace}-${fieldKey}-${rowIndex}-${f.key}`;
  return (
    <div class="flex flex-col gap-3" id={listId}>
      <OptionListRows
        f={f}
        name={name}
        items={items}
        ctx={ctx}
        namespace={namespace}
        fieldKey={fieldKey}
        rowIndex={rowIndex}
        disabled={disabled}
        listId={listId}
      />
    </div>
  );
}
