import {
  type ButtonInteraction,
  type GuildMember,
  type ThreadChannel,
} from "discord.js";
import { replyEphemeral } from "../../lib/core/discordInteractions.js";
import { guardTicketThreadAction } from "./guards.js";
import { isClosedTicketThread } from "./names.js";
import {
  buildConfirmRow,
  DELETE_CONFIRM_PREFIX,
  DELETE_PREFIX,
} from "../../lib/modules/tickets/panel.js";
import { canStaffOrAdmin } from "./permissions.js";
import { texts } from "../../lib/modules/tickets/config-io.js";

interface ParsedDeleteCustomId {
  threadId: string;
  typeId: string;
}

function parseDeleteCustomId(customId: string): ParsedDeleteCustomId | null {
  const confirm = customId.startsWith(DELETE_CONFIRM_PREFIX);
  const prefix = confirm ? DELETE_CONFIRM_PREFIX : DELETE_PREFIX;
  if (!customId.startsWith(prefix)) return null;

  const segments = customId.slice(prefix.length).split(":");
  if (segments.length < 2) return null;

  return { threadId: segments[0], typeId: segments.slice(1).join(":") };
}

function canDeleteTicket(
  interaction: ButtonInteraction,
  staffRoleIds: string[],
): boolean {
  const member = interaction.member as GuildMember | null;
  if (!member) return false;
  return canStaffOrAdmin(member, staffRoleIds);
}

export async function handleDeleteTicket(
  interaction: ButtonInteraction,
): Promise<void> {
  const parsed = parseDeleteCustomId(interaction.customId);
  if (!parsed) {
    await replyEphemeral(interaction, texts().invalidInteraction);
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

  if (!canDeleteTicket(interaction, ticketType.staffRoleIds)) {
    await replyEphemeral(interaction, t.noDeletePermission);
    return;
  }

  const deletePayload = `${parsed.threadId}:${parsed.typeId}`;

  if (!isConfirm) {
    const row = buildConfirmRow(
      `${DELETE_CONFIRM_PREFIX}${deletePayload}`,
      `tickets:delete-cancel:${parsed.threadId}`,
      ticketType.confirmDeleteYes,
      ticketType.confirmDeleteNo,
    );

    await replyEphemeral(interaction, {
      content: ticketType.confirmDeletePrompt,
      components: [row],
    });
    return;
  }

  if (!canDeleteTicket(interaction, ticketType.staffRoleIds)) {
    await replyEphemeral(interaction, t.noDeletePermission);
    return;
  }

  await interaction.update({
    content: ticketType.ticketDeleted,
    components: [],
  });

  try {
    await (thread as ThreadChannel).delete();
  } catch (err) {
    console.error("[tickets] Failed to delete ticket thread:", err);
    await replyEphemeral(interaction, t.deleteError);
  }
}

export async function handleDeleteCancel(
  interaction: ButtonInteraction,
): Promise<void> {
  await interaction.update({
    content: texts().deleteCancelled,
    components: [],
  });
}
