import type { GuildChannel } from '../../../plugin-types.js';
import { FieldWrap, fieldValueStr } from './shared.js';
import type { SubFieldProps } from './shared.js';

function channelOptions(channels: GuildChannel[], value: string) {
  const opts = [
    <option value="">— none —</option>,
    ...channels.map((ch) => (
      <option value={ch.id} selected={ch.id === value}>
        #{ch.name}
      </option>
    )),
  ];
  if (value && !channels.some((ch) => ch.id === value)) {
    opts.push(
      <option value={value} selected>
        {value} (not found)
      </option>,
    );
  }
  return opts;
}

export function ChannelField({
  f,
  value,
  name,
  ctx,
  disabled,
  ...extra
}: SubFieldProps & Record<string, unknown>) {
  const id = name.replace(/[[\].]/g, '-');
  const strVal = fieldValueStr(value);

  if (ctx.channelsError) {
    return (
      <FieldWrap id={id} label={f.label} help={f.help} disabled={disabled}>
        <input class="form-control" type="text" id={id} name={name} value={strVal} disabled={disabled} />
        <div class="form-text text-danger">
          {ctx.channelsError} Enter id manually.
        </div>
      </FieldWrap>
    );
  }

  return (
    <FieldWrap id={id} label={f.label} help={f.help} disabled={disabled}>
      <select class="form-select" id={id} name={name} disabled={disabled} {...extra}>
        {channelOptions(ctx.channels, strVal)}
      </select>
    </FieldWrap>
  );
}

export function ChannelMultiField({ f, value, name, ctx, disabled }: SubFieldProps) {
  const id = name.replace(/[[\].]/g, '-');
  const selected = Array.isArray(value) ? value.map(String) : [];

  if (ctx.channelsError) {
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
          {ctx.channelsError} Enter id(s) comma-separated.
        </div>
      </FieldWrap>
    );
  }

  return (
    <FieldWrap id={id} label={f.label} help={f.help} disabled={disabled}>
      <div class="border rounded p-2 checklist-scroll">
        {ctx.channels.length === 0 ? (
          <div class="form-text text-secondary">No channels available.</div>
        ) : (
          ctx.channels.map((ch) => (
            <label class="form-check">
              <input
                class="form-check-input"
                type="checkbox"
                name={`${name}[]`}
                value={ch.id}
                checked={selected.includes(ch.id)}
                disabled={disabled}
              />
              <span class="form-check-label">#{ch.name}</span>
            </label>
          ))
        )}
        {selected
          .filter((sid) => !ctx.channels.some((ch) => ch.id === sid))
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
