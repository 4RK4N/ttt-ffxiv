import type { WebPluginSubField } from '../../../plugin-types.js';
import type { EditorContext } from '../context.js';

export interface SubFieldProps {
  f: WebPluginSubField;
  value: unknown;
  ctx: EditorContext;
  name: string;
  disabled?: boolean;
}

export interface TopFieldProps {
  f: import('../../../plugin-types.js').WebPluginField;
  value: unknown;
  ctx: EditorContext;
  namespace: string;
  expanded?: string[];
}

export function fieldValueStr(value: unknown): string {
  return value != null ? String(value) : '';
}

export function Help({ text }: { text?: string }) {
  if (!text) return null;
  return <div class="form-text text-secondary">{text}</div>;
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
    <div class={`mb-3 field${disabled ? ' disabled' : ''}`}>
      <label class="form-label" for={id}>
        {label}
      </label>
      <Help text={help} />
      {children}
    </div>
  );
}
