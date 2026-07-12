import { type ButtonInteraction, type GuildMember } from "discord.js";
import { replyEphemeral } from "../../lib/core/discordInteractions.js";
import { finalizeTicketClose, resolveOpenerUserId } from "./finalize-close.js";
import { runTicketConfirmFlow } from "./confirm-flow.js";
import { guardTicketThreadAction } from "./guards.js";
import {
  buildConfirmRow,
  CLOSE_CONFIRM_PREFIX,
  CLOSE_PREFIX,
} from "../../lib/modules/tickets/panel.js";
import { canStaffOrAdmin } from "./permissions.js";
import { texts } from "../../lib/modules/tickets/config-io.js";

interface ParsedCloseCustomId {
  threadId: string;
  typeId: string;
  openerUserId?: string;
}

function parseCloseCustomId(customId: string): ParsedCloseCustomId | null {
  const confirm = customId.startsWith(CLOSE_CONFIRM_PREFIX);
  const prefix = confirm ? CLOSE_CONFIRM_PREFIX : CLOSE_PREFIX;
  if (!customId.startsWith(prefix)) return null;

  const segments = customId.slice(prefix.length).split(":");
  if (segments.length < 2) return null;

  const threadId = segments[0];
  if (segments.length >= 3) {
    return { threadId, typeId: segments[1], openerUserId: segments[2] };
  }
  return { threadId, typeId: segments.slice(1).join(":") };
}

function canCloseTicket(
  interaction: ButtonInteraction,
  openerUserId: string | null,
  staffRoleId: string,
): boolean {
  if (openerUserId && interaction.user.id === openerUserId) return true;

  const member = interaction.member as GuildMember | null;
  if (!member) return false;
  return canStaffOrAdmin(member, staffRoleId);
}

export async function handleCloseTicket(
  interaction: ButtonInteraction,
): Promise<void> {
  const parsed = parseCloseCustomId(interaction.customId);
  if (!parsed) {
    await replyEphemeral(interaction, texts().invalidInteraction);
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
    content: texts().closeCancelled,
    components: [],
  });
}
