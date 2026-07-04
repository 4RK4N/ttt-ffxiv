import type { WebPluginSubField } from '../../../plugin-types.js';
import type { EditorContext } from '../context.js';
import { SubField } from '../Field.js';

function fieldValueStr(value: unknown): string {
  return value != null ? String(value) : '';
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
  const items = (Array.isArray(value) ? value : []) as Record<string, unknown>[];
  const listId = `optlist-${namespace}-${fieldKey}-${rowIndex}-${f.key}`;

  return (
    <div class={`mb-3 field${disabled ? ' disabled' : ''}`}>
      <label class="form-label">{f.label}</label>
      {f.help ? <div class="form-text text-secondary">{f.help}</div> : null}
      <div class="vstack gap-3" id={listId}>
        {items.map((item, optIndex) => (
          <div class="card">
            <div class="card-body">
              <input type="hidden" name={`${name}[${optIndex}].id`} value={fieldValueStr(item.id)} />
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
                class="btn btn-outline-danger mt-2"
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
      </div>
      <button
        type="button"
        class="btn mt-2"
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
    <div class="vstack gap-3" id={listId}>
      {items.map((item, optIndex) => (
        <div class="card">
          <div class="card-body">
            <input type="hidden" name={`${name}[${optIndex}].id`} value={fieldValueStr(item.id)} />
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
              class="btn btn-outline-danger mt-2"
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
    </div>
  );
}
