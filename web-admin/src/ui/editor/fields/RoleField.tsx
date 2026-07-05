import type { GuildRole } from "../../../plugin-types.js";
import { FieldWrap, fieldValueStr } from "./shared.js";
import type { SubFieldProps } from "./shared.js";

function roleOptions(roles: GuildRole[], value: string) {
  const opts = [
    <option value="">— none —</option>,
    ...roles.map((role) => (
      <option value={role.id} selected={role.id === value}>
        {role.name}
      </option>
    )),
  ];
  if (value && !roles.some((r) => r.id === value)) {
    opts.push(
      <option value={value} selected>
        {value} (not found)
      </option>,
    );
  }
  return opts;
}

export function RoleField({ f, value, name, ctx, disabled }: SubFieldProps) {
  const id = name.replace(/[[\].]/g, "-");
  const strVal = fieldValueStr(value);

  if (ctx.rolesError) {
    return (
      <FieldWrap id={id} label={f.label} help={f.help} disabled={disabled}>
        <input
          class="input input-bordered w-full"
          type="text"
          id={id}
          name={name}
          value={strVal}
          disabled={disabled}
        />
        <p class="mt-1 text-sm text-error">
          {ctx.rolesError} Enter id manually.
        </p>
      </FieldWrap>
    );
  }

  return (
    <FieldWrap id={id} label={f.label} help={f.help} disabled={disabled}>
      <select class="select select-bordered w-full" id={id} name={name} disabled={disabled}>
        {roleOptions(ctx.roles, strVal)}
      </select>
    </FieldWrap>
  );
}

export function RoleMultiField({
  f,
  value,
  name,
  ctx,
  disabled,
}: SubFieldProps) {
  const id = name.replace(/[[\].]/g, "-");
  const selected = Array.isArray(value) ? value.map(String) : [];

  if (ctx.rolesError) {
    return (
      <FieldWrap id={id} label={f.label} help={f.help} disabled={disabled}>
        <input
          class="input input-bordered w-full"
          type="text"
          id={id}
          name={name}
          value={selected.join(", ")}
          disabled={disabled}
        />
        <p class="mt-1 text-sm text-error">
          {ctx.rolesError} Enter id(s) comma-separated.
        </p>
      </FieldWrap>
    );
  }

  return (
    <FieldWrap id={id} label={f.label} help={f.help} disabled={disabled}>
      <div class="checklist-scroll rounded-box border border-base-300 p-2">
        {ctx.roles.length === 0 ? (
          <p class="text-sm text-base-content/60">No roles available.</p>
        ) : (
          ctx.roles.map((role) => (
            <label class="flex cursor-pointer items-center gap-3 py-1">
              <input
                class="checkbox checkbox-primary checkbox-sm shrink-0"
                type="checkbox"
                name={`${name}[]`}
                value={role.id}
                checked={selected.includes(role.id)}
                disabled={disabled}
              />
              <span class="min-w-0 break-words">{role.name}</span>
            </label>
          ))
        )}
        {selected
          .filter((sid) => !ctx.roles.some((r) => r.id === sid))
          .map((sid) => (
            <label class="flex cursor-pointer items-center gap-3 py-1">
              <input
                class="checkbox checkbox-primary checkbox-sm shrink-0"
                type="checkbox"
                name={`${name}[]`}
                value={sid}
                checked
                disabled={disabled}
              />
              <span class="min-w-0 break-words">{sid} (not found)</span>
            </label>
          ))}
      </div>
    </FieldWrap>
  );
}
