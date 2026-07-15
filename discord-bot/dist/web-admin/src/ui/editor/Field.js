import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "hono/jsx/jsx-runtime";
import { isFieldVisible } from "../../editor-logic.js";
import { TextField, TextareaField } from "./fields/TextField.js";
import { ChannelField, ChannelMultiField } from "./fields/ChannelField.js";
import { RoleField, RoleMultiField } from "./fields/RoleField.js";
import { BooleanField, SelectField } from "./fields/BooleanField.js";
import { ObjectListField } from "./fields/ObjectListField.js";
import { fieldValueStr } from "./fields/shared.js";
export function SubField(props) {
    const { f, ...rest } = props;
    if (f.type === "text")
        return _jsx(TextField, { f: f, ...rest });
    if (f.type === "textarea")
        return _jsx(TextareaField, { f: f, ...rest });
    if (f.type === "channel")
        return _jsx(ChannelField, { f: f, ...rest });
    if (f.type === "channel-multi")
        return _jsx(ChannelMultiField, { f: f, ...rest });
    if (f.type === "role")
        return _jsx(RoleField, { f: f, ...rest });
    if (f.type === "role-multi")
        return _jsx(RoleMultiField, { f: f, ...rest });
    if (f.type === "boolean")
        return _jsx(BooleanField, { f: f, ...rest });
    if (f.type === "select")
        return _jsx(SelectField, { f: f, ...rest });
    return _jsx(TextField, { f: f, ...rest });
}
export function Field({ f, value, ctx, namespace, expanded, }) {
    if (f.type === "object-list") {
        return (_jsx(ObjectListField, { f: f, value: value, ctx: ctx, namespace: namespace, expanded: expanded }));
    }
    return (_jsx(SubField, { f: f, value: value, name: f.key, ctx: ctx }));
}
function clearedValue(sub) {
    if (sub.type === "boolean")
        return false;
    if (sub.type === "channel-multi" || sub.type === "role-multi")
        return [];
    return "";
}
export function RowSubFieldsWithWatch({ field, row, rowIndex, ctx, namespace, expanded, }) {
    const prefix = `${field.key}[${rowIndex}]`;
    const subReaders = (field.itemFields ?? []).map((sub) => ({
        key: sub.key,
        getValue: () => row[sub.key],
        def: sub,
    }));
    const watchAttrs = {
        "hx-post": `/htmx/modules/${namespace}/row/${field.key}/${rowIndex}/refresh?expanded=${encodeURIComponent((expanded ?? []).join(","))}`,
        "hx-trigger": "change",
        "hx-target": `#row-${namespace}-${field.key}-${rowIndex}`,
        "hx-swap": "outerHTML",
        "hx-include": `#panel-form-${namespace}`,
    };
    return (_jsxs(_Fragment, { children: [_jsx("input", { type: "hidden", name: `${prefix}.id`, value: fieldValueStr(row.id) }), _jsx("input", { type: "hidden", name: `${prefix}.published`, value: row.published === true ? "true" : "false" }), (field.itemFields ?? [])
                .filter((sub) => sub.type !== "option-list")
                .map((sub) => {
                const visible = isFieldVisible(sub, subReaders);
                const name = `${prefix}.${sub.key}`;
                const triggersWatch = (field.itemFields ?? []).some((other) => other.visibleWhen &&
                    Object.keys(other.visibleWhen).includes(sub.key));
                const extra = triggersWatch && (sub.type === "select" || sub.type === "channel")
                    ? watchAttrs
                    : {};
                return (_jsxs("div", { class: visible ? "" : "hidden", children: [_jsx(SubField, { f: sub, value: visible ? row[sub.key] : clearedValue(sub), name: name, ctx: ctx, disabled: !visible, ...extra }), !visible && sub.clearWhenHidden ? (_jsx("p", { class: "text-sm text-base-content/60", children: "Not available for this configuration." })) : null] }));
            })] }));
}
export { ObjectListRow } from "./fields/ObjectListField.js";
//# sourceMappingURL=Field.js.map