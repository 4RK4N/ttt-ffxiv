import { FieldWrap, fieldValueStr, textInputMaxLength } from "./shared.js";
import type { SubFieldProps } from "./shared.js";

export function TextField({ f, value, name, disabled }: SubFieldProps) {
  const id = name.replace(/[[\].]/g, "-");
  return (
    <FieldWrap label={f.label} help={f.help} disabled={disabled}>
      <input
        class="input input-bordered w-full"
        type="text"
        id={id}
        name={name}
        value={fieldValueStr(value)}
        maxLength={textInputMaxLength(f)}
        disabled={disabled}
      />
    </FieldWrap>
  );
}

export function TextareaField({ f, value, name, disabled }: SubFieldProps) {
  const id = name.replace(/[[\].]/g, "-");
  return (
    <FieldWrap label={f.label} help={f.help} disabled={disabled}>
      <textarea
        class="textarea textarea-bordered w-full"
        id={id}
        name={name}
        rows={4}
        maxLength={textInputMaxLength(f)}
        disabled={disabled}
      >
        {fieldValueStr(value)}
      </textarea>
    </FieldWrap>
  );
}
