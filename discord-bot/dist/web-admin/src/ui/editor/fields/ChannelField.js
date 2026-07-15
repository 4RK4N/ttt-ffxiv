import { jsx as _jsx, jsxs as _jsxs } from "hono/jsx/jsx-runtime";
import { FieldWrap, fieldValueStr } from "./shared.js";
function channelOptions(channels, value) {
    const opts = [
        _jsx("option", { value: "", children: "\u2014 none \u2014" }),
        ...channels.map((ch) => (_jsxs("option", { value: ch.id, selected: ch.id === value, children: ["#", ch.name] }))),
    ];
    if (value && !channels.some((ch) => ch.id === value)) {
        opts.push(_jsxs("option", { value: value, selected: true, children: [value, " (not found)"] }));
    }
    return opts;
}
export function ChannelField({ f, value, name, ctx, disabled, ...extra }) {
    const id = name.replace(/[[\].]/g, "-");
    const strVal = fieldValueStr(value);
    if (ctx.channelsError) {
        return (_jsxs(FieldWrap, { id: id, label: f.label, help: f.help, disabled: disabled, children: [_jsx("input", { class: "input input-bordered w-full", type: "text", id: id, name: name, value: strVal, disabled: disabled }), _jsxs("p", { class: "mt-1 text-sm text-error", children: [ctx.channelsError, " Enter id manually."] })] }));
    }
    return (_jsx(FieldWrap, { id: id, label: f.label, help: f.help, disabled: disabled, children: _jsx("select", { class: "select select-bordered w-full", id: id, name: name, disabled: disabled, ...extra, children: channelOptions(ctx.channels, strVal) }) }));
}
export function ChannelMultiField({ f, value, name, ctx, disabled, }) {
    const id = name.replace(/[[\].]/g, "-");
    const selected = Array.isArray(value) ? value.map(String) : [];
    if (ctx.channelsError) {
        return (_jsxs(FieldWrap, { id: id, label: f.label, help: f.help, disabled: disabled, children: [_jsx("input", { class: "input input-bordered w-full", type: "text", id: id, name: name, value: selected.join(", "), disabled: disabled }), _jsxs("p", { class: "mt-1 text-sm text-error", children: [ctx.channelsError, " Enter id(s) comma-separated."] })] }));
    }
    return (_jsx(FieldWrap, { id: id, label: f.label, help: f.help, disabled: disabled, children: _jsxs("div", { class: "checklist-scroll rounded-box border border-base-300 p-2", children: [ctx.channels.length === 0 ? (_jsx("p", { class: "text-sm text-base-content/60", children: "No channels available." })) : (ctx.channels.map((ch) => (_jsxs("label", { class: "flex cursor-pointer items-center gap-3 py-1", children: [_jsx("input", { class: "checkbox checkbox-primary checkbox-sm shrink-0", type: "checkbox", name: `${name}[]`, value: ch.id, checked: selected.includes(ch.id), disabled: disabled }), _jsxs("span", { class: "min-w-0 break-words", children: ["#", ch.name] })] })))), selected
                    .filter((sid) => !ctx.channels.some((ch) => ch.id === sid))
                    .map((sid) => (_jsxs("label", { class: "flex cursor-pointer items-center gap-3 py-1", children: [_jsx("input", { class: "checkbox checkbox-primary checkbox-sm shrink-0", type: "checkbox", name: `${name}[]`, value: sid, checked: true, disabled: disabled }), _jsxs("span", { class: "min-w-0 break-words", children: [sid, " (not found)"] })] })))] }) }));
}
//# sourceMappingURL=ChannelField.js.map