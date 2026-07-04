import { FieldWrap } from './shared.js';
import type { SubFieldProps } from './shared.js';

export function BooleanField({ f, value, name, disabled }: SubFieldProps) {
  const id = name.replace(/[[\].]/g, '-');
  const checked = value === true;
  return (
    <FieldWrap id={id} label={f.label} help={f.help} disabled={disabled}>
      <label class="form-check form-switch">
        <input
          class="form-check-input"
          type="checkbox"
          id={id}
          name={name}
          value="true"
          checked={checked}
          disabled={disabled}
          onchange="this.closest('label').querySelector('.form-check-label').textContent = this.checked ? 'On' : 'Off'"
        />
        <span class="form-check-label">{checked ? 'On' : 'Off'}</span>
      </label>
    </FieldWrap>
  );
}

export function SelectField({
  f,
  value,
  name,
  disabled,
  ...extra
}: SubFieldProps & Record<string, unknown>) {
  const id = name.replace(/[[\].]/g, '-');
  const strVal = value != null ? String(value) : '';
  return (
    <FieldWrap id={id} label={f.label} help={f.help} disabled={disabled}>
      <select class="form-select" id={id} name={name} disabled={disabled} {...extra}>
        {(f.options ?? []).map((opt) => (
          <option value={opt.value} selected={opt.value === strVal}>
            {opt.label}
          </option>
        ))}
      </select>
    </FieldWrap>
  );
}
