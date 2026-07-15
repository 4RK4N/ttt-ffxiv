import { type ButtonInteraction, type ThreadChannel } from "discord.js";
import { replyEphemeral } from "../../lib/core/discordInteractions.js";
import { runTicketConfirmFlow } from "./confirm-flow.js";
import { guardTicketThreadAction } from "./guards.js";
import { clearOpenTicketByThreadId } from "./open-index.js";
import { isClosedTicketThread } from "./names.js";
import { parseDeleteCustomId } from "./parsers.js";
import {
  buildConfirmRow,
  DELETE_CONFIRM_PREFIX,
} from "../../lib/modules/tickets/panel.js";
import { canDeleteTicket } from "./permissions.js";
import { get } from "../../lib/modules/tickets/config-io.js";

export async function handleDeleteTicket(
  interaction: ButtonInteraction,
): Promise<void> {
  const parsed = parseDeleteCustomId(interaction.customId);
  if (!parsed) {
    await replyEphemeral(interaction, get("invalidInteraction"));
    return;
  }

  const isConfirm = interaction.customId.startsWith(DELETE_CONFIRM_PREFIX);
  const guarded = await guardTicketThreadAction(
    interaction,
    parsed.typeId,
    parsed.threadId,
  );
  if (!guarded.ok) return;

  const { ticketType, thread, t } = guarded.ctx;

  if (!isClosedTicketThread(thread.name, thread.locked === true)) {
    await replyEphemeral(interaction, t.deleteNotClosed);
    return;
  }

  const deletePayload = `${parsed.threadId}:${parsed.typeId}`;

  const flow = await runTicketConfirmFlow({
    interaction,
    isConfirm,
    confirmPrefix: DELETE_CONFIRM_PREFIX,
    actionPayload: deletePayload,
    cancelCustomId: `tickets:delete-cancel:${parsed.threadId}`,
    labels: {
      prompt: ticketType.confirmDeletePrompt,
      yesLabel: ticketType.confirmDeleteYes,
      noLabel: ticketType.confirmDeleteNo,
    },
    buildConfirmRow,
    canPerform: () => canDeleteTicket(interaction, ticketType.staffRoleId),
    deniedMessage: t.noDeletePermission,
  });

  if (flow !== "confirmed") return;

  await interaction.update({
    content: ticketType.ticketDeleted,
    components: [],
  });

  try {
    await (thread as ThreadChannel).delete();
    clearOpenTicketByThreadId(parsed.threadId);
  } catch (err) {
    console.error("[tickets] Failed to delete ticket thread:", err);
    await replyEphemeral(interaction, t.deleteError);
  }
}

export async function handleDeleteCancel(
  interaction: ButtonInteraction,
): Promise<void> {
  await interaction.update({
    content: get("deleteCancelled"),
    components: [],
  });
}
