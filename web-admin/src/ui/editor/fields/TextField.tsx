import { DISCORD_MESSAGE_CONTENT_MAX } from "../../../../../shared/core/limits.js";
import { FieldWrap, fieldValueStr } from "./shared.js";
import type { SubFieldProps } from "./shared.js";

export function TextField({ f, value, name, disabled }: SubFieldProps) {
  const id = name.replace(/[[\].]/g, "-");
  return (
    <FieldWrap id={id} label={f.label} help={f.help} disabled={disabled}>
      <input
        class="input input-bordered w-full"
        type="text"
        id={id}
        name={name}
        value={fieldValueStr(value)}
        maxLength={DISCORD_MESSAGE_CONTENT_MAX}
        disabled={disabled}
      />
    </FieldWrap>
  );
}

export function TextareaField({ f, value, name, disabled }: SubFieldProps) {
  const id = name.replace(/[[\].]/g, "-");
  return (
    <FieldWrap id={id} label={f.label} help={f.help} disabled={disabled}>
      <textarea
        class="textarea textarea-bordered w-full"
        id={id}
        name={name}
        rows={4}
        maxLength={DISCORD_MESSAGE_CONTENT_MAX}
        disabled={disabled}
      >
        {fieldValueStr(value)}
      </textarea>
    </FieldWrap>
  );
}
