import { type ButtonInteraction } from "discord.js";
import { replyEphemeral } from "../../lib/core/discordInteractions.js";
import { finalizeTicketClose, resolveOpenerUserId } from "./finalize-close.js";
import { runTicketConfirmFlow } from "./confirm-flow.js";
import { guardTicketThreadAction } from "./guards.js";
import { parseCloseCustomId } from "./parsers.js";
import {
  buildConfirmRow,
  CLOSE_CONFIRM_PREFIX,
} from "../../lib/modules/tickets/panel.js";
import { canCloseTicket } from "./permissions.js";
import { get } from "../../lib/modules/tickets/config-io.js";

export async function handleCloseTicket(
  interaction: ButtonInteraction,
): Promise<void> {
  const parsed = parseCloseCustomId(interaction.customId);
  if (!parsed) {
    await replyEphemeral(interaction, get("invalidInteraction"));
    return;
  }

  const isConfirm = interaction.customId.startsWith(CLOSE_CONFIRM_PREFIX);
  const guarded = await guardTicketThreadAction(
    interaction,
    parsed.typeId,
    parsed.threadId,
  );
  if (!guarded.ok) return;

  const { ticketType, thread, t } = guarded.ctx;
  const { openerUserId, welcomeMessage } = await resolveOpenerUserId(
    thread,
    parsed.openerUserId,
  );

  const closePayload = parsed.openerUserId
    ? `${parsed.threadId}:${parsed.typeId}:${parsed.openerUserId}`
    : `${parsed.threadId}:${parsed.typeId}:${openerUserId ?? ""}`;

  const flow = await runTicketConfirmFlow({
    interaction,
    isConfirm,
    confirmPrefix: CLOSE_CONFIRM_PREFIX,
    actionPayload: closePayload,
    cancelCustomId: `tickets:close-cancel:${parsed.threadId}`,
    labels: {
      prompt: ticketType.confirmClosePrompt,
      yesLabel: ticketType.confirmCloseYes,
      noLabel: ticketType.confirmCloseNo,
    },
    buildConfirmRow,
    canPerform: () =>
      canCloseTicket(interaction, openerUserId, ticketType.staffRoleId),
    deniedMessage: t.noPermission,
  });

  if (flow !== "confirmed") return;

  await interaction.deferUpdate();

  try {
    await finalizeTicketClose(
      thread,
      parsed.typeId,
      ticketType,
      ticketType.ticketClosed,
      welcomeMessage,
      openerUserId,
    );
  } catch (err) {
    console.error("[tickets] Failed to close ticket:", err);
    await replyEphemeral(interaction, t.closeError);
  }
}

export async function handleCloseCancel(
  interaction: ButtonInteraction,
): Promise<void> {
  await interaction.update({
    content: get("closeCancelled"),
    components: [],
  });
}
