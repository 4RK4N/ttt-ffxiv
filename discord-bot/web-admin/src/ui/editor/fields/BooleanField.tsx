import { FieldWrap } from "./shared.js";
import type { SubFieldProps } from "./shared.js";

export function BooleanField({ f, value, name, disabled }: SubFieldProps) {
  const id = name.replace(/[[\].]/g, "-");
  const checked = value === true;
  return (
    <FieldWrap label={f.label} help={f.help} disabled={disabled}>
      <div class="flex items-center gap-3">
        <input
          class="toggle toggle-success"
          type="checkbox"
          id={id}
          name={name}
          value="true"
          checked={checked}
          disabled={disabled}
        />
        <span class="text-sm text-base-content/80 toggle-label">
          {checked ? "On" : "Off"}
        </span>
      </div>
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
  const id = name.replace(/[[\].]/g, "-");
  const strVal = value != null ? String(value) : "";
  return (
    <FieldWrap label={f.label} help={f.help} disabled={disabled}>
      <select
        class="select select-bordered w-full"
        id={id}
        name={name}
        disabled={disabled}
        {...extra}
      >
        {(f.options ?? []).map((opt) => (
          <option value={opt.value} selected={opt.value === strVal}>
            {opt.label}
          </option>
        ))}
      </select>
    </FieldWrap>
  );
}
