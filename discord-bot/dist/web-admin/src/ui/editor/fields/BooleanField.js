import { jsx as _jsx, jsxs as _jsxs } from "hono/jsx/jsx-runtime";
import { FieldWrap } from "./shared.js";
export function BooleanField({ f, value, name, disabled }) {
    const id = name.replace(/[[\].]/g, "-");
    const checked = value === true;
    return (_jsx(FieldWrap, { id: id, label: f.label, help: f.help, disabled: disabled, children: _jsxs("div", { class: "flex items-center gap-3", children: [_jsx("input", { class: "toggle toggle-success", type: "checkbox", id: id, name: name, value: "true", checked: checked, disabled: disabled }), _jsx("span", { class: "text-sm text-base-content/80 toggle-label", children: checked ? "On" : "Off" })] }) }));
}
export function SelectField({ f, value, name, disabled, ...extra }) {
    const id = name.replace(/[[\].]/g, "-");
    const strVal = value != null ? String(value) : "";
    return (_jsx(FieldWrap, { id: id, label: f.label, help: f.help, disabled: disabled, children: _jsx("select", { class: "select select-bordered w-full", id: id, name: name, disabled: disabled, ...extra, children: (f.options ?? []).map((opt) => (_jsx("option", { value: opt.value, selected: opt.value === strVal, children: opt.label }))) }) }));
}
//# sourceMappingURL=BooleanField.js.map