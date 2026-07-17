import type { WebPluginField } from "../../../plugin-types.js";
import type { EditorContext } from "../context.js";
import { RowSubFieldsWithWatch } from "../Field.js";
import { OptionListField } from "./OptionListField.js";
import { FieldWrap, fieldValueStr } from "./shared.js";

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
    merged.openButtonLabel ??
    merged.panelTitle ??
    merged.id ??
    field.itemLabel ??
    "Item",
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

  const expandedParam = encodeURIComponent((expanded ?? []).join(","));
  const toggleUrl = `/htmx/modules/${namespace}/row/${field.key}/${rowIndex}/toggle?expanded=${expandedParam}`;
  const listPrefix = field.key;

  return (
    <div
      class={`card bg-base-200 shadow-sm${collapsed ? " is-collapsed" : ""}`}
      id={`row-${namespace}-${field.key}-${rowIndex}`}
    >
      <div
        class={`flex items-center justify-between gap-2 border-b border-base-300 p-4${field.collapsible ? " is-toggle" : ""}`}
        {...(field.collapsible
          ? {
            "hx-post": toggleUrl,
            "hx-target": `#row-${namespace}-${field.key}-${rowIndex}`,
            "hx-swap": "outerHTML",
            "hx-include": `#panel-form-${namespace}`,
          }
          : {})}
      >
        <div class="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
          {field.collapsible ? (
            <span class="collapse-chevron" aria-hidden="true">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </span>
          ) : null}
          <h3 class="truncate font-semibold">{cardTitle(field, row, row)}</h3>
        </div>
        <span
          class={`badge ${row.published ? "badge-success" : "badge-ghost"}`}
        >
          {row.published ? "Published" : "Unpublished"}
        </span>
      </div>
      <div class="card-content card-body border-t border-base-300 pt-0">
        <RowSubFieldsWithWatch
          field={field}
          row={row}
          rowIndex={rowIndex}
          ctx={ctx}
          namespace={namespace}
          expanded={expanded}
        />
        {(field.itemFields ?? [])
          .filter((sub) => sub.type === "option-list")
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
        <div class="mt-3 flex flex-wrap gap-2">
          {field.publishable ? (
            <>
              <button
                type="button"
                class="btn btn-success btn-sm"
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
                class="btn btn-outline btn-warning btn-sm"
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
            class="btn btn-outline btn-error btn-sm"
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
  const items = (Array.isArray(value) ? value : []) as Record<
    string,
    unknown
  >[];
  const expandedParam = encodeURIComponent((expanded ?? []).join(","));

  const listId = `list-${namespace}-${f.key}`;

  return (
    <FieldWrap label={f.label} help={f.help}>
      <div class="flex flex-col gap-3" id={listId}>
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
        class="btn btn-sm mt-2"
        hx-post={`/htmx/modules/${namespace}/list/${f.key}/add?expanded=${expandedParam}`}
        hx-include={`#panel-form-${namespace}`}
        hx-target={`#${listId}`}
        hx-swap="innerHTML"
      >
        Add {(f.itemLabel ?? "item").toLowerCase()}
      </button>
    </FieldWrap>
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
