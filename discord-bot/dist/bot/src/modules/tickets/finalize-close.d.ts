import { type Message, type ThreadChannel } from "discord.js";
import type { ResolvedTicketType } from "#shared/modules/tickets/types.js";
export interface OpenerResolution {
    openerUserId: string | null;
    welcomeMessage?: Message;
}
/** Bot-created private threads have the bot as owner, not the opener. */
export declare function resolveOpenerUserId(thread: ThreadChannel, parsedOpenerUserId?: string): Promise<OpenerResolution>;
export declare function finalizeTicketClose(thread: ThreadChannel, typeId: string, ticketType: ResolvedTicketType, closedContent: string, welcomeMessage?: Message, openerUserId?: string | null): Promise<void>;
//# sourceMappingURL=finalize-close.d.ts.map