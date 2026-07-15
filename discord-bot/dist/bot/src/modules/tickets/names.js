import { stripCustomEmoji, THREAD_NAME_MAX } from "../../lib/core/threads.js";
const CLOSED_PREFIX = "[CLOSED] ";
function pad2(n) {
    return String(n).padStart(2, "0");
}
/** Formats a date as `YYYY.MM.DD HH:mm` (local time). */
export function formatTicketTimestamp(date) {
    return (`${date.getFullYear()}.${pad2(date.getMonth() + 1)}.${pad2(date.getDate())} ` +
        `${pad2(date.getHours())}:${pad2(date.getMinutes())}`);
}
/** `{displayName} - {YYYY.MM.DD HH:mm}` truncated to Discord's 100-char limit. */
export function buildTicketThreadName(displayName, date) {
    const suffix = ` - ${formatTicketTimestamp(date)}`;
    const maxNameLen = THREAD_NAME_MAX - suffix.length;
    let name = stripCustomEmoji(displayName);
    if (name.length > maxNameLen) {
        name = name.slice(0, Math.max(0, maxNameLen - 3)) + "...";
    }
    return `${name}${suffix}`;
}
/** Prefixes the open-time thread name for closed tickets. */
export function buildClosedThreadName(openName) {
    const base = stripCustomEmoji(openName);
    const maxBase = THREAD_NAME_MAX - CLOSED_PREFIX.length;
    const trimmed = base.length <= maxBase ? base : base.slice(0, maxBase - 3) + "...";
    return CLOSED_PREFIX + trimmed;
}
export function isClosedTicketThread(name, locked) {
    return locked && name.startsWith(CLOSED_PREFIX);
}
//# sourceMappingURL=names.js.map