import type { GuildRole } from '../../../plugin-types.js';
import { FieldWrap, fieldValueStr } from './shared.js';
import type { SubFieldProps } from './shared.js';

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
  const id = name.replace(/[[\].]/g, '-');
  const strVal = fieldValueStr(value);

  if (ctx.rolesError) {
    return (
      <FieldWrap id={id} label={f.label} help={f.help} disabled={disabled}>
        <input class="form-control" type="text" id={id} name={name} value={strVal} disabled={disabled} />
        <div class="form-text text-danger">{ctx.rolesError} Enter id manually.</div>
      </FieldWrap>
    );
  }

  return (
    <FieldWrap id={id} label={f.label} help={f.help} disabled={disabled}>
      <select class="form-select" id={id} name={name} disabled={disabled}>
        {roleOptions(ctx.roles, strVal)}
      </select>
    </FieldWrap>
  );
}

export function RoleMultiField({ f, value, name, ctx, disabled }: SubFieldProps) {
  const id = name.replace(/[[\].]/g, '-');
  const selected = Array.isArray(value) ? value.map(String) : [];

  if (ctx.rolesError) {
    return (
      <FieldWrap id={id} label={f.label} help={f.help} disabled={disabled}>
        <input
          class="form-control"
          type="text"
          id={id}
          name={name}
          value={selected.join(', ')}
          disabled={disabled}
        />
        <div class="form-text text-danger">
          {ctx.rolesError} Enter id(s) comma-separated.
        </div>
      </FieldWrap>
    );
  }

  return (
    <FieldWrap id={id} label={f.label} help={f.help} disabled={disabled}>
      <div class="border rounded p-2 checklist-scroll">
        {ctx.roles.length === 0 ? (
          <div class="form-text text-secondary">No roles available.</div>
        ) : (
          ctx.roles.map((role) => (
            <label class="form-check">
              <input
                class="form-check-input"
                type="checkbox"
                name={`${name}[]`}
                value={role.id}
                checked={selected.includes(role.id)}
                disabled={disabled}
              />
              <span class="form-check-label">{role.name}</span>
            </label>
          ))
        )}
        {selected
          .filter((sid) => !ctx.roles.some((r) => r.id === sid))
          .map((sid) => (
            <label class="form-check">
              <input
                class="form-check-input"
                type="checkbox"
                name={`${name}[]`}
                value={sid}
                checked
                disabled={disabled}
              />
              <span class="form-check-label">{sid} (not found)</span>
            </label>
          ))}
      </div>
    </FieldWrap>
  );
}
