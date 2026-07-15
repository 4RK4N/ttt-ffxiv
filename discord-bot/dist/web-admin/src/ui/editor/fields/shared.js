import { jsx as _jsx, jsxs as _jsxs } from "hono/jsx/jsx-runtime";
import { resolveFieldMaxLength } from "#shared/core/limits.js";
export function fieldValueStr(value) {
    return value != null ? String(value) : "";
}
/** HTML maxLength for text/textarea; uses plugin config when set. */
export function textInputMaxLength(f) {
    return resolveFieldMaxLength(f.maxLength);
}
export function Help({ text }) {
    if (!text)
        return null;
    return _jsx("p", { class: "mb-1 text-sm text-base-content/60", children: text });
}
export function FieldWrap({ id, label, help, children, disabled, }) {
    return (_jsxs("div", { class: `mb-4 field w-full${disabled ? " disabled" : ""}`, children: [_jsx("label", { class: "mb-1 block font-medium", for: id, children: label }), _jsx(Help, { text: help }), children] }));
}
//# sourceMappingURL=shared.js.map