import { resolveFieldMaxLength } from "@shared/core/limits.js";
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
  return <p class="mb-1 text-sm text-base-content/60">{text}</p>;
}

export function FieldWrap({
  id,
  label,
  help,
  children,
  disabled,
}: {
  id: string;
  label: string;
  help?: string;
  children: unknown;
  disabled?: boolean;
}) {
  return (
    <div class={`mb-4 field w-full${disabled ? " disabled" : ""}`}>
      <label class="mb-1 block font-medium" for={id}>
        {label}
      </label>
      <Help text={help} />
      {children}
    </div>
  );
}
