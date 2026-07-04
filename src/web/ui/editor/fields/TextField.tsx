import { FieldWrap, fieldValueStr } from './shared.js';
import type { SubFieldProps } from './shared.js';

export function TextField({ f, value, name, disabled }: SubFieldProps) {
  const id = name.replace(/[[\].]/g, '-');
  return (
    <FieldWrap id={id} label={f.label} help={f.help} disabled={disabled}>
      <input
        class="form-control"
        type="text"
        id={id}
        name={name}
        value={fieldValueStr(value)}
        disabled={disabled}
      />
    </FieldWrap>
  );
}

export function TextareaField({ f, value, name, disabled }: SubFieldProps) {
  const id = name.replace(/[[\].]/g, '-');
  return (
    <FieldWrap id={id} label={f.label} help={f.help} disabled={disabled}>
      <textarea class="form-control" id={id} name={name} rows={4} disabled={disabled}>
        {fieldValueStr(value)}
      </textarea>
    </FieldWrap>
  );
}
