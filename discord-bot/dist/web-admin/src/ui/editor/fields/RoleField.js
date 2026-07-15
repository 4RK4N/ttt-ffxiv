import { jsx as _jsx, jsxs as _jsxs } from "hono/jsx/jsx-runtime";
import { FieldWrap, fieldValueStr } from "./shared.js";
function roleOptions(roles, value) {
    const opts = [
        _jsx("option", { value: "", children: "\u2014 none \u2014" }),
        ...roles.map((role) => (_jsx("option", { value: role.id, selected: role.id === value, children: role.name }))),
    ];
    if (value && !roles.some((r) => r.id === value)) {
        opts.push(_jsxs("option", { value: value, selected: true, children: [value, " (not found)"] }));
    }
    return opts;
}
export function RoleField({ f, value, name, ctx, disabled }) {
    const id = name.replace(/[[\].]/g, "-");
    const strVal = fieldValueStr(value);
    if (ctx.rolesError) {
        return (_jsxs(FieldWrap, { id: id, label: f.label, help: f.help, disabled: disabled, children: [_jsx("input", { class: "input input-bordered w-full", type: "text", id: id, name: name, value: strVal, disabled: disabled }), _jsxs("p", { class: "mt-1 text-sm text-error", children: [ctx.rolesError, " Enter id manually."] })] }));
    }
    return (_jsx(FieldWrap, { id: id, label: f.label, help: f.help, disabled: disabled, children: _jsx("select", { class: "select select-bordered w-full", id: id, name: name, disabled: disabled, children: roleOptions(ctx.roles, strVal) }) }));
}
export function RoleMultiField({ f, value, name, ctx, disabled, }) {
    const id = name.replace(/[[\].]/g, "-");
    const selected = Array.isArray(value) ? value.map(String) : [];
    if (ctx.rolesError) {
        return (_jsxs(FieldWrap, { id: id, label: f.label, help: f.help, disabled: disabled, children: [_jsx("input", { class: "input input-bordered w-full", type: "text", id: id, name: name, value: selected.join(", "), disabled: disabled }), _jsxs("p", { class: "mt-1 text-sm text-error", children: [ctx.rolesError, " Enter id(s) comma-separated."] })] }));
    }
    return (_jsx(FieldWrap, { id: id, label: f.label, help: f.help, disabled: disabled, children: _jsxs("div", { class: "checklist-scroll rounded-box border border-base-300 p-2", children: [ctx.roles.length === 0 ? (_jsx("p", { class: "text-sm text-base-content/60", children: "No roles available." })) : (ctx.roles.map((role) => (_jsxs("label", { class: "flex cursor-pointer items-center gap-3 py-1", children: [_jsx("input", { class: "checkbox checkbox-primary checkbox-sm shrink-0", type: "checkbox", name: `${name}[]`, value: role.id, checked: selected.includes(role.id), disabled: disabled }), _jsx("span", { class: "min-w-0 break-words", children: role.name })] })))), selected
                    .filter((sid) => !ctx.roles.some((r) => r.id === sid))
                    .map((sid) => (_jsxs("label", { class: "flex cursor-pointer items-center gap-3 py-1", children: [_jsx("input", { class: "checkbox checkbox-primary checkbox-sm shrink-0", type: "checkbox", name: `${name}[]`, value: sid, checked: true, disabled: disabled }), _jsxs("span", { class: "min-w-0 break-words", children: [sid, " (not found)"] })] })))] }) }));
}
//# sourceMappingURL=RoleField.js.map