/** Formats a date as `YYYY.MM.DD HH:mm` (local time). */
export declare function formatTicketTimestamp(date: Date): string;
/** `{displayName} - {YYYY.MM.DD HH:mm}` truncated to Discord's 100-char limit. */
export declare function buildTicketThreadName(displayName: string, date: Date): string;
/** Prefixes the open-time thread name for closed tickets. */
export declare function buildClosedThreadName(openName: string): string;
export declare function isClosedTicketThread(name: string, locked: boolean): boolean;
//# sourceMappingURL=names.d.ts.map