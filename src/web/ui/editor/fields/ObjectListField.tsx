import type { WebPluginField } from '../../../plugin-types.js';
import type { EditorContext } from '../context.js';
import { RowSubFieldsWithWatch } from '../Field.js';
import { OptionListField } from './OptionListField.js';

function rowKey(item: Record<string, unknown>, index: number): string {
  const id = item.id;
  return id && String(id).trim() ? String(id).trim() : `__idx__${index}`;
}

function cardTitle(
  field: WebPluginField,
  row: Record<string, unknown>,
  subValues: Record<string, unknown>,
): string {
  const merged = { ...row, ...subValues };
  return String(
    merged.openButtonLabel ?? merged.panelTitle ?? merged.id ?? field.itemLabel ?? 'Item',
  );
}

export function ObjectListRow({
  field,
  row,
  rowIndex,
  ctx,
  namespace,
  expanded,
}: {
  field: WebPluginField;
  row: Record<string, unknown>;
  rowIndex: number;
  ctx: EditorContext;
  namespace: string;
  expanded?: string[];
}) {
  const key = rowKey(row, rowIndex);
  const collapsed =
    field.collapsible &&
    row.id &&
    String(row.id).trim() &&
    !(expanded ?? []).includes(key);

  const expandedParam = encodeURIComponent((expanded ?? []).join(','));
  const toggleUrl = `/htmx/modules/${namespace}/row/${field.key}/${rowIndex}/toggle?expanded=${expandedParam}`;
  const listPrefix = field.key;

  return (
    <div
      class={`card${collapsed ? ' is-collapsed' : ''}`}
      id={`row-${namespace}-${field.key}-${rowIndex}`}
    >
      <div
        class={`card-header d-flex align-items-center justify-content-between gap-2${field.collapsible ? ' is-toggle' : ''}`}
        {...(field.collapsible
          ? {
            'hx-post': toggleUrl,
            'hx-target': `#row-${namespace}-${field.key}-${rowIndex}`,
            'hx-swap': 'outerHTML',
            'hx-include': `#panel-form-${namespace} :input`,
          }
          : {})}
      >
        <div class="d-flex align-items-center gap-2 flex-fill overflow-hidden">
          {field.collapsible ? (
            <span class="text-secondary" aria-hidden="true">
              {collapsed ? '\u25B6' : '\u25BC'}
            </span>
          ) : null}
          <h3 class="card-title mb-0 text-truncate">
            {cardTitle(field, row, row as Record<string, unknown>)}
          </h3>
        </div>
        <span class={`badge ${row.published ? 'bg-success' : 'bg-secondary-lt'}`}>
          {row.published ? 'Published' : 'Unpublished'}
        </span>
      </div>
      <div class="card-body">
        <RowSubFieldsWithWatch
          field={field}
          row={row}
          rowIndex={rowIndex}
          ctx={ctx}
          namespace={namespace}
          expanded={expanded}
        />
        {(field.itemFields ?? [])
          .filter((sub) => sub.type === 'option-list')
          .map((sub) => (
            <OptionListField
              f={sub}
              value={row[sub.key]}
              name={`${listPrefix}[${rowIndex}].${sub.key}`}
              ctx={ctx}
              namespace={namespace}
              fieldKey={field.key}
              rowIndex={rowIndex}
            />
          ))}
        <div class="d-flex flex-wrap gap-2 mt-3">
          {field.publishable ? (
            <>
              <button
                type="button"
                class="btn btn-success"
                hx-post={`/htmx/modules/${namespace}/publish/${fieldValueStr(row.id) || String(rowIndex)}`}
                hx-include={`#panel-form-${namespace}`}
                hx-target={`#htmx-panel-${namespace}`}
                hx-swap="outerHTML"
                disabled={!row.channelId && !row.id}
              >
                Publish panel
              </button>
              <button
                type="button"
                class="btn"
                hx-post={`/htmx/modules/${namespace}/unpublish/${fieldValueStr(row.id)}`}
                hx-include={`#panel-form-${namespace}`}
                hx-target={`#htmx-panel-${namespace}`}
                hx-swap="outerHTML"
                disabled={row.published !== true}
              >
                Unpublish
              </button>
            </>
          ) : null}
          <button
            type="button"
            class="btn btn-outline-danger"
            hx-post={`/htmx/modules/${namespace}/list/${field.key}/remove/${rowIndex}?expanded=${expandedParam}`}
            hx-include={`#panel-form-${namespace}`}
            hx-target={`#list-${namespace}-${field.key}`}
            hx-swap="innerHTML"
          >
            DELETE
          </button>
        </div>
      </div>
    </div>
  );
}

function fieldValueStr(value: unknown): string {
  return value != null ? String(value) : '';
}

export function ObjectListField({
  f,
  value,
  ctx,
  namespace,
  expanded,
}: {
  f: WebPluginField;
  value: unknown;
  ctx: EditorContext;
  namespace: string;
  expanded?: string[];
}) {
  const items = (Array.isArray(value) ? value : []) as Record<string, unknown>[];
  const expandedParam = encodeURIComponent((expanded ?? []).join(','));

  return (
    <div class="mb-3 field">
      <label class="form-label">{f.label}</label>
      {f.help ? <div class="form-text text-secondary">{f.help}</div> : null}
      <div class="vstack gap-3" id={`list-${namespace}-${f.key}`}>
        {items.map((row, index) => (
          <ObjectListRow
            field={f}
            row={row}
            rowIndex={index}
            ctx={ctx}
            namespace={namespace}
            expanded={expanded}
          />
        ))}
      </div>
      <button
        type="button"
        class="btn mt-2"
        hx-post={`/htmx/modules/${namespace}/list/${f.key}/add?expanded=${expandedParam}`}
        hx-include={`#panel-form-${namespace}`}
        hx-target={`#list-${namespace}-${f.key}`}
        hx-swap="innerHTML"
      >
        Add {(f.itemLabel ?? 'item').toLowerCase()}
      </button>
    </div>
  );
}

export function ObjectListRowsOnly({
  field,
  items,
  ctx,
  namespace,
  expanded,
}: {
  field: WebPluginField;
  items: Record<string, unknown>[];
  ctx: EditorContext;
  namespace: string;
  expanded?: string[];
}) {
  return (
    <>
      {items.map((row, index) => (
        <ObjectListRow
          field={field}
          row={row}
          rowIndex={index}
          ctx={ctx}
          namespace={namespace}
          expanded={expanded}
        />
      ))}
    </>
  );
}
