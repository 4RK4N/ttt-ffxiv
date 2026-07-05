import type { GuildChannel } from "../../../plugin-types.js";
import { FieldWrap, fieldValueStr } from "./shared.js";
import type { SubFieldProps } from "./shared.js";

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
  const id = name.replace(/[[\].]/g, "-");
  const strVal = fieldValueStr(value);

  if (ctx.channelsError) {
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
          {ctx.channelsError} Enter id manually.
        </p>
      </FieldWrap>
    );
  }

  return (
    <FieldWrap id={id} label={f.label} help={f.help} disabled={disabled}>
      <select
        class="select select-bordered w-full"
        id={id}
        name={name}
        disabled={disabled}
        {...extra}
      >
        {channelOptions(ctx.channels, strVal)}
      </select>
    </FieldWrap>
  );
}

export function ChannelMultiField({
  f,
  value,
  name,
  ctx,
  disabled,
}: SubFieldProps) {
  const id = name.replace(/[[\].]/g, "-");
  const selected = Array.isArray(value) ? value.map(String) : [];

  if (ctx.channelsError) {
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
          {ctx.channelsError} Enter id(s) comma-separated.
        </p>
      </FieldWrap>
    );
  }

  return (
    <FieldWrap id={id} label={f.label} help={f.help} disabled={disabled}>
      <div class="checklist-scroll rounded-box border border-base-300 p-2">
        {ctx.channels.length === 0 ? (
          <p class="text-sm text-base-content/60">No channels available.</p>
        ) : (
          ctx.channels.map((ch) => (
            <label class="flex cursor-pointer items-center gap-3 py-1">
              <input
                class="checkbox checkbox-primary checkbox-sm shrink-0"
                type="checkbox"
                name={`${name}[]`}
                value={ch.id}
                checked={selected.includes(ch.id)}
                disabled={disabled}
              />
              <span class="min-w-0 break-words">#{ch.name}</span>
            </label>
          ))
        )}
        {selected
          .filter((sid) => !ctx.channels.some((ch) => ch.id === sid))
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
