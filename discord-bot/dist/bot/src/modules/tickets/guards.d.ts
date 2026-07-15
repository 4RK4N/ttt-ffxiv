import type { ButtonInteraction, ThreadChannel } from "discord.js";
import { data } from "../../lib/modules/tickets/config-io.js";
import type { ResolvedTicketType } from "#shared/modules/tickets/types.js";
export interface TicketThreadGuardOptions {
    /** When true, reject closed/locked ticket threads. */
    requireOpen?: boolean;
}
export interface TicketThreadContext {
    ticketType: ResolvedTicketType;
    thread: ThreadChannel;
    t: ReturnType<typeof data>;
}
export type TicketThreadGuardResult = {
    ok: true;
    ctx: TicketThreadContext;
} | {
    ok: false;
};
/** Shared preamble for ticket thread button actions (close/delete/role-action). */
export declare function guardTicketThreadAction(interaction: ButtonInteraction, typeId: string, expectedThreadId: string, options?: TicketThreadGuardOptions): Promise<TicketThreadGuardResult>;
//# sourceMappingURL=guards.d.ts.map