const THREAD_NAME_MAX = 100;
const CLOSED_PREFIX = '[CLOSED] ';

const CUSTOM_EMOJI_REGEX = /<a?:\w+:\d+>/g;

function sanitizeSegment(value: string): string {
  return value.replace(CUSTOM_EMOJI_REGEX, '').replace(/\s+/g, ' ').trim();
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** Formats a date as `YYYY.MM.DD HH:mm` (local time). */
export function formatTicketTimestamp(date: Date): string {
  return (
    `${date.getFullYear()}.${pad2(date.getMonth() + 1)}.${pad2(date.getDate())} ` +
    `${pad2(date.getHours())}:${pad2(date.getMinutes())}`
  );
}

/** `{displayName} - {YYYY.MM.DD HH:mm}` truncated to Discord's 100-char limit. */
export function buildTicketThreadName(displayName: string, date: Date): string {
  const suffix = ` - ${formatTicketTimestamp(date)}`;
  const maxNameLen = THREAD_NAME_MAX - suffix.length;
  let name = sanitizeSegment(displayName);
  if (name.length > maxNameLen) {
    name = name.slice(0, Math.max(0, maxNameLen - 3)) + '...';
  }
  return `${name}${suffix}`;
}

/** Prefixes the open-time thread name for closed tickets. */
export function buildClosedThreadName(openName: string): string {
  const base = sanitizeSegment(openName);
  const maxBase = THREAD_NAME_MAX - CLOSED_PREFIX.length;
  const trimmed = base.length <= maxBase ? base : base.slice(0, maxBase - 3) + '...';
  return CLOSED_PREFIX + trimmed;
}
