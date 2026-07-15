import { jsx as _jsx } from "hono/jsx/jsx-runtime";
import { FieldWrap, fieldValueStr, textInputMaxLength } from "./shared.js";
export function TextField({ f, value, name, disabled }) {
    const id = name.replace(/[[\].]/g, "-");
    return (_jsx(FieldWrap, { id: id, label: f.label, help: f.help, disabled: disabled, children: _jsx("input", { class: "input input-bordered w-full", type: "text", id: id, name: name, value: fieldValueStr(value), maxLength: textInputMaxLength(f), disabled: disabled }) }));
}
export function TextareaField({ f, value, name, disabled }) {
    const id = name.replace(/[[\].]/g, "-");
    return (_jsx(FieldWrap, { id: id, label: f.label, help: f.help, disabled: disabled, children: _jsx("textarea", { class: "textarea textarea-bordered w-full", id: id, name: name, rows: 4, maxLength: textInputMaxLength(f), disabled: disabled, children: fieldValueStr(value) }) }));
}
//# sourceMappingURL=TextField.js.map