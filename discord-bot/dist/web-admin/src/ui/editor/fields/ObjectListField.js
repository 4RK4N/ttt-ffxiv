import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "hono/jsx/jsx-runtime";
import { RowSubFieldsWithWatch } from "../Field.js";
import { OptionListField } from "./OptionListField.js";
import { fieldValueStr } from "./shared.js";
function rowKey(item, index) {
    const id = item.id;
    return id && String(id).trim() ? String(id).trim() : `__idx__${index}`;
}
function cardTitle(field, row, subValues) {
    const merged = { ...row, ...subValues };
    return String(merged.openButtonLabel ??
        merged.panelTitle ??
        merged.id ??
        field.itemLabel ??
        "Item");
}
export function ObjectListRow({ field, row, rowIndex, ctx, namespace, expanded, }) {
    const key = rowKey(row, rowIndex);
    const collapsed = field.collapsible &&
        row.id &&
        String(row.id).trim() &&
        !(expanded ?? []).includes(key);
    const expandedParam = encodeURIComponent((expanded ?? []).join(","));
    const toggleUrl = `/htmx/modules/${namespace}/row/${field.key}/${rowIndex}/toggle?expanded=${expandedParam}`;
    const listPrefix = field.key;
    return (_jsxs("div", { class: `card bg-base-200 shadow-sm${collapsed ? " is-collapsed" : ""}`, id: `row-${namespace}-${field.key}-${rowIndex}`, children: [_jsxs("div", { class: `flex items-center justify-between gap-2 border-b border-base-300 p-4${field.collapsible ? " is-toggle" : ""}`, ...(field.collapsible
                    ? {
                        "hx-post": toggleUrl,
                        "hx-target": `#row-${namespace}-${field.key}-${rowIndex}`,
                        "hx-swap": "outerHTML",
                        "hx-include": `#panel-form-${namespace}`,
                    }
                    : {}), children: [_jsxs("div", { class: "flex min-w-0 flex-1 items-center gap-2 overflow-hidden", children: [field.collapsible ? (_jsx("span", { class: "collapse-chevron", "aria-hidden": "true", children: _jsx("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round", children: _jsx("path", { d: "m9 18 6-6-6-6" }) }) })) : null, _jsx("h3", { class: "truncate font-semibold", children: cardTitle(field, row, row) })] }), _jsx("span", { class: `badge ${row.published ? "badge-success" : "badge-ghost"}`, children: row.published ? "Published" : "Unpublished" })] }), _jsxs("div", { class: "card-content card-body border-t border-base-300 pt-0", children: [_jsx(RowSubFieldsWithWatch, { field: field, row: row, rowIndex: rowIndex, ctx: ctx, namespace: namespace, expanded: expanded }), (field.itemFields ?? [])
                        .filter((sub) => sub.type === "option-list")
                        .map((sub) => (_jsx(OptionListField, { f: sub, value: row[sub.key], name: `${listPrefix}[${rowIndex}].${sub.key}`, ctx: ctx, namespace: namespace, fieldKey: field.key, rowIndex: rowIndex }))), _jsxs("div", { class: "mt-3 flex flex-wrap gap-2", children: [field.publishable ? (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", class: "btn btn-success btn-sm", "hx-post": `/htmx/modules/${namespace}/publish/${fieldValueStr(row.id) || String(rowIndex)}`, "hx-include": `#panel-form-${namespace}`, "hx-target": `#htmx-panel-${namespace}`, "hx-swap": "outerHTML", disabled: !row.channelId && !row.id, children: "Publish panel" }), _jsx("button", { type: "button", class: "btn btn-outline btn-warning btn-sm", "hx-post": `/htmx/modules/${namespace}/unpublish/${fieldValueStr(row.id)}`, "hx-include": `#panel-form-${namespace}`, "hx-target": `#htmx-panel-${namespace}`, "hx-swap": "outerHTML", disabled: row.published !== true, children: "Unpublish" })] })) : null, _jsx("button", { type: "button", class: "btn btn-outline btn-error btn-sm", "hx-post": `/htmx/modules/${namespace}/list/${field.key}/remove/${rowIndex}?expanded=${expandedParam}`, "hx-include": `#panel-form-${namespace}`, "hx-target": `#list-${namespace}-${field.key}`, "hx-swap": "innerHTML", children: "DELETE" })] })] })] }));
}
export function ObjectListField({ f, value, ctx, namespace, expanded, }) {
    const items = (Array.isArray(value) ? value : []);
    const expandedParam = encodeURIComponent((expanded ?? []).join(","));
    return (_jsxs("div", { class: "field mb-4 w-full", children: [_jsx("label", { class: "mb-1 block font-medium", children: f.label }), f.help ? (_jsx("p", { class: "mb-1 text-sm text-base-content/60", children: f.help })) : null, _jsx("div", { class: "flex flex-col gap-3", id: `list-${namespace}-${f.key}`, children: items.map((row, index) => (_jsx(ObjectListRow, { field: f, row: row, rowIndex: index, ctx: ctx, namespace: namespace, expanded: expanded }))) }), _jsxs("button", { type: "button", class: "btn btn-sm mt-2", "hx-post": `/htmx/modules/${namespace}/list/${f.key}/add?expanded=${expandedParam}`, "hx-include": `#panel-form-${namespace}`, "hx-target": `#list-${namespace}-${f.key}`, "hx-swap": "innerHTML", children: ["Add ", (f.itemLabel ?? "item").toLowerCase()] })] }));
}
export function ObjectListRowsOnly({ field, items, ctx, namespace, expanded, }) {
    return (_jsx(_Fragment, { children: items.map((row, index) => (_jsx(ObjectListRow, { field: field, row: row, rowIndex: index, ctx: ctx, namespace: namespace, expanded: expanded }))) }));
}
//# sourceMappingURL=ObjectListField.js.map