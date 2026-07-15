import { type Client } from "discord.js";
export declare function registerOpenTicket(channelId: string, userId: string, threadId: string): void;
export declare function clearOpenTicket(channelId: string, userId: string): void;
export declare function clearOpenTicketByThreadId(threadId: string): void;
export declare function lookupOpenTicketThreadId(channelId: string, userId: string): string | undefined;
export declare function registerOpenTicketIndexHandlers(client: Client): void;
/** Test-only reset. */
export declare function resetOpenTicketIndexForTests(): void;
//# sourceMappingURL=open-index.d.ts.map