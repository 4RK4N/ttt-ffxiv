import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "hono/jsx/jsx-runtime";
/** Matches store readEnabled: only explicit false is off. */
export function isModuleEnabled(enabled) {
    return enabled !== false;
}
export function StatusDot({ namespace, enabled, oob, }) {
    const on = isModuleEnabled(enabled);
    return (_jsx("span", { id: `status-dot-${namespace}`, class: `status-dot ${on ? "status-green" : "status-muted"}`, ...(oob ? { "hx-swap-oob": "true" } : {}) }));
}
export function EnabledToggle({ namespace, enabled, }) {
    const on = isModuleEnabled(enabled);
    const toggleId = `enabled-toggle-${namespace}`;
    return (_jsx("div", { id: toggleId, children: _jsxs("label", { class: "flex cursor-pointer items-center justify-end gap-3", children: [_jsx("span", { class: "text-sm text-base-content/80 toggle-label", children: on ? "On" : "Off" }), _jsx("input", { class: "toggle toggle-success", type: "checkbox", name: "enabled", value: "true", checked: on, "data-htmx-revert-toggle": "", "hx-disabled-elt": "this", "hx-put": `/htmx/modules/${namespace}/enabled`, "hx-trigger": "change", "hx-target": `#${toggleId}`, "hx-swap": "outerHTML", "hx-include": "this" })] }) }));
}
/** HTMX response fragment: re-render toggle + OOB sidebar status dot. */
export function EnabledToggleResponse({ namespace, enabled, }) {
    return (_jsxs(_Fragment, { children: [_jsx(EnabledToggle, { namespace: namespace, enabled: enabled }), _jsx(StatusDot, { namespace: namespace, enabled: enabled, oob: true })] }));
}
//# sourceMappingURL=enabled-ui.js.map