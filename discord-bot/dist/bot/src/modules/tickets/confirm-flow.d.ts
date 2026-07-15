import type { ButtonInteraction } from "discord.js";
import type { ActionRowBuilder, ButtonBuilder } from "discord.js";
export interface TicketConfirmLabels {
    prompt: string;
    yesLabel: string;
    noLabel: string;
}
export interface TicketConfirmFlowOptions {
    interaction: ButtonInteraction;
    isConfirm: boolean;
    confirmPrefix: string;
    actionPayload: string;
    cancelCustomId: string;
    labels: TicketConfirmLabels;
    buildConfirmRow: (yesCustomId: string, noCustomId: string, yesLabel: string, noLabel: string) => ActionRowBuilder<ButtonBuilder>;
    canPerform: () => boolean;
    deniedMessage: string;
}
/**
 * Shared confirm-step flow for ticket close/delete: permission check, optional
 * confirm prompt, and TOCTOU re-check before the caller runs the action.
 */
export declare function runTicketConfirmFlow(options: TicketConfirmFlowOptions): Promise<"prompted" | "denied" | "confirmed">;
//# sourceMappingURL=confirm-flow.d.ts.map