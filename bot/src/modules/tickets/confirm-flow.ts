import type { ButtonInteraction } from "discord.js";
import type { ActionRowBuilder, ButtonBuilder } from "discord.js";
import { replyEphemeral } from "../../lib/core/discordInteractions.js";

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
  buildConfirmRow: (
    yesCustomId: string,
    noCustomId: string,
    yesLabel: string,
    noLabel: string,
  ) => ActionRowBuilder<ButtonBuilder>;
  canPerform: () => boolean;
  deniedMessage: string;
}

/**
 * Shared confirm-step flow for ticket close/delete: permission check, optional
 * confirm prompt, and TOCTOU re-check before the caller runs the action.
 */
export async function runTicketConfirmFlow(
  options: TicketConfirmFlowOptions,
): Promise<"prompted" | "denied" | "confirmed"> {
  const {
    interaction,
    isConfirm,
    confirmPrefix,
    actionPayload,
    cancelCustomId,
    labels,
    buildConfirmRow,
    canPerform,
    deniedMessage,
  } = options;

  if (!canPerform()) {
    await replyEphemeral(interaction, deniedMessage);
    return "denied";
  }

  if (!isConfirm) {
    const row = buildConfirmRow(
      `${confirmPrefix}${actionPayload}`,
      cancelCustomId,
      labels.yesLabel,
      labels.noLabel,
    );
    await replyEphemeral(interaction, {
      content: labels.prompt,
      components: [row],
    });
    return "prompted";
  }

  if (!canPerform()) {
    await replyEphemeral(interaction, deniedMessage);
    return "denied";
  }

  return "confirmed";
}
