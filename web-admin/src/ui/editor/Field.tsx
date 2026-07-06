import type { WebPluginField, WebPluginSubField } from "../../plugin-types.js";
import { isFieldVisible } from "../../editor-logic.js";
import type { EditorContext } from "./context.js";
import { TextField, TextareaField } from "./fields/TextField.js";
import { ChannelField, ChannelMultiField } from "./fields/ChannelField.js";
import { RoleField, RoleMultiField } from "./fields/RoleField.js";
import { BooleanField, SelectField } from "./fields/BooleanField.js";
import { ObjectListField } from "./fields/ObjectListField.js";
import { fieldValueStr, type SubFieldProps } from "./fields/shared.js";

export function SubField(props: SubFieldProps & Record<string, unknown>) {
  const { f, ...rest } = props;
  if (f.type === "text") return <TextField f={f} {...rest} />;
  if (f.type === "textarea") return <TextareaField f={f} {...rest} />;
  if (f.type === "channel") return <ChannelField f={f} {...rest} />;
  if (f.type === "channel-multi") return <ChannelMultiField f={f} {...rest} />;
  if (f.type === "role") return <RoleField f={f} {...rest} />;
  if (f.type === "role-multi") return <RoleMultiField f={f} {...rest} />;
  if (f.type === "boolean") return <BooleanField f={f} {...rest} />;
  if (f.type === "select") return <SelectField f={f} {...rest} />;
  return <TextField f={f} {...rest} />;
}

export function Field({
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
  if (f.type === "object-list") {
    return (
      <ObjectListField
        f={f}
        value={value}
        ctx={ctx}
        namespace={namespace}
        expanded={expanded}
      />
    );
  }
  return (
    <SubField f={f as WebPluginSubField} value={value} name={f.key} ctx={ctx} />
  );
}

function clearedValue(sub: WebPluginSubField): unknown {
  if (sub.type === "boolean") return false;
  if (sub.type === "channel-multi" || sub.type === "role-multi") return [];
  return "";
}

export function RowSubFieldsWithWatch({
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

  return (
    <>
      <input
        type="hidden"
        name={`${prefix}.id`}
        value={fieldValueStr(row.id)}
      />
      <input
        type="hidden"
        name={`${prefix}.published`}
        value={row.published === true ? "true" : "false"}
      />
      {(field.itemFields ?? [])
        .filter((sub) => sub.type !== "option-list")
        .map((sub) => {
          const visible = isFieldVisible(sub, subReaders);
          const name = `${prefix}.${sub.key}`;
          const triggersWatch = (field.itemFields ?? []).some(
            (other) =>
              other.visibleWhen &&
              Object.keys(other.visibleWhen).includes(sub.key),
          );
          const extra =
            triggersWatch && (sub.type === "select" || sub.type === "channel")
              ? watchAttrs
              : {};

          return (
            <div class={visible ? "" : "hidden"}>
              <SubField
                f={sub}
                value={visible ? row[sub.key] : clearedValue(sub)}
                name={name}
                ctx={ctx}
                disabled={!visible}
                {...extra}
              />
              {!visible && sub.clearWhenHidden ? (
                <p class="text-sm text-base-content/60">
                  Not available for this configuration.
                </p>
              ) : null}
            </div>
          );
        })}
    </>
  );
}

export { ObjectListRow } from "./fields/ObjectListField.js";
