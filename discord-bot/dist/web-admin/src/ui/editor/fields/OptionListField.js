import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "hono/jsx/jsx-runtime";
import { SubField } from "../Field.js";
import { fieldValueStr } from "./shared.js";
function OptionListRows({ f, name, items, ctx, namespace, fieldKey, rowIndex, disabled, listId, }) {
    return (_jsx(_Fragment, { children: items.map((item, optIndex) => (_jsx("div", { class: "card bg-base-100 shadow-sm", children: _jsxs("div", { class: "card-body", children: [_jsx("input", { type: "hidden", name: `${name}[${optIndex}].id`, value: fieldValueStr(item.id) }), (f.optionFields ?? []).map((sub) => (_jsx(SubField, { f: sub, value: item[sub.key], name: `${name}[${optIndex}].${sub.key}`, ctx: ctx, disabled: disabled }))), _jsx("button", { type: "button", class: "btn btn-outline btn-error btn-sm mt-2", "hx-post": `/htmx/modules/${namespace}/list/${fieldKey}/option/${f.key}/remove/${rowIndex}/${optIndex}`, "hx-include": `#panel-form-${namespace}`, "hx-target": `#${listId}`, "hx-swap": "innerHTML", disabled: disabled, children: "Remove" })] }) }))) }));
}
export function OptionListField({ f, value, name, ctx, namespace, fieldKey, rowIndex, disabled, }) {
    const items = (Array.isArray(value) ? value : []);
    const listId = `optlist-${namespace}-${fieldKey}-${rowIndex}-${f.key}`;
    return (_jsxs("div", { class: `field mb-4 w-full${disabled ? " disabled" : ""}`, children: [_jsx("label", { class: "label py-0", children: _jsx("span", { class: "label-text font-medium", children: f.label }) }), f.help ? (_jsx("p", { class: "mb-1 text-sm text-base-content/60", children: f.help })) : null, _jsx("div", { class: "flex flex-col gap-3", id: listId, children: _jsx(OptionListRows, { f: f, name: name, items: items, ctx: ctx, namespace: namespace, fieldKey: fieldKey, rowIndex: rowIndex, disabled: disabled, listId: listId }) }), _jsx("button", { type: "button", class: "btn btn-sm mt-2", "hx-post": `/htmx/modules/${namespace}/list/${fieldKey}/option/${f.key}/add/${rowIndex}`, "hx-include": `#panel-form-${namespace}`, "hx-target": `#${listId}`, "hx-swap": "innerHTML", disabled: disabled, children: "Add option" })] }));
}
export function OptionListRowsOnly({ f, name, items, ctx, namespace, fieldKey, rowIndex, disabled, }) {
    const listId = `optlist-${namespace}-${fieldKey}-${rowIndex}-${f.key}`;
    return (_jsx("div", { class: "flex flex-col gap-3", id: listId, children: _jsx(OptionListRows, { f: f, name: name, items: items, ctx: ctx, namespace: namespace, fieldKey: fieldKey, rowIndex: rowIndex, disabled: disabled, listId: listId }) }));
}
//# sourceMappingURL=OptionListField.js.map