import { resolveFieldMaxLength } from "#shared/core/limits.js";
import type { WebPluginSubField } from "../../../plugin-types.js";
import type { EditorContext } from "../context.js";

export interface SubFieldProps {
  f: WebPluginSubField;
  value: unknown;
  ctx: EditorContext;
  name: string;
  disabled?: boolean;
}

export interface TopFieldProps {
  f: import("../../../plugin-types.js").WebPluginField;
  value: unknown;
  ctx: EditorContext;
  namespace: string;
  expanded?: string[];
}

export function fieldValueStr(value: unknown): string {
  return value != null ? String(value) : "";
}

/** HTML maxLength for text/textarea; uses plugin config when set. */
export function textInputMaxLength(
  f: Pick<WebPluginSubField, "maxLength">,
): number {
  return resolveFieldMaxLength(f.maxLength);
}

export function Help({ text }: { text?: string }) {
  if (!text) return null;
  return <p class="label">{text}</p>;
}

export function FieldWrap({
  label,
  help,
  children,
  disabled,
}: {
  label: string;
  help?: string;
  children: unknown;
  disabled?: boolean;
}) {
  return (
    <fieldset
      class={`fieldset field mb-4 w-full${disabled ? " disabled" : ""}`}
    >
      <legend class="fieldset-legend">{label}</legend>
      <Help text={help} />
      {children}
    </fieldset>
  );
}
