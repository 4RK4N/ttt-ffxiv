import {
  type ButtonInteraction,
  type GuildMember,
} from 'discord.js';
import { replyEphemeral } from '../../core/discordInteractions.js';
import { finalizeTicketClose, resolveOpenerUserId } from './finalize-close.js';
import { guardTicketThreadAction } from './guards.js';
import { buildConfirmRow, CLOSE_CONFIRM_PREFIX, CLOSE_PREFIX } from './panel.js';
import { canStaffOrAdmin } from './permissions.js';
import { texts } from './config-io.js';

interface ParsedCloseCustomId {
  threadId: string;
  typeId: string;
  openerUserId?: string;
}

function parseCloseCustomId(customId: string): ParsedCloseCustomId | null {
  const confirm = customId.startsWith(CLOSE_CONFIRM_PREFIX);
  const prefix = confirm ? CLOSE_CONFIRM_PREFIX : CLOSE_PREFIX;
  if (!customId.startsWith(prefix)) return null;

  const segments = customId.slice(prefix.length).split(':');
  if (segments.length < 2) return null;

  const threadId = segments[0];
  if (segments.length >= 3) {
    return { threadId, typeId: segments[1], openerUserId: segments[2] };
  }
  return { threadId, typeId: segments.slice(1).join(':') };
}

function canCloseTicket(
  interaction: ButtonInteraction,
  openerUserId: string | null,
  staffRoleIds: string[]
): boolean {
  if (openerUserId && interaction.user.id === openerUserId) return true;

  const member = interaction.member as GuildMember | null;
  if (!member) return false;
  return canStaffOrAdmin(member, staffRoleIds);
}

export async function handleCloseTicket(interaction: ButtonInteraction): Promise<void> {
  const parsed = parseCloseCustomId(interaction.customId);
  if (!parsed) return;

  const isConfirm = interaction.customId.startsWith(CLOSE_CONFIRM_PREFIX);
  const guarded = await guardTicketThreadAction(interaction, parsed.typeId, parsed.threadId);
  if (!guarded.ok) return;

  const { ticketType, thread, t } = guarded.ctx;
  const openerUserId = await resolveOpenerUserId(thread, parsed.openerUserId);

  if (!canCloseTicket(interaction, openerUserId, ticketType.staffRoleIds)) {
    await replyEphemeral(interaction, t.noPermission);
    return;
  }

  const closePayload = parsed.openerUserId
    ? `${parsed.threadId}:${parsed.typeId}:${parsed.openerUserId}`
    : `${parsed.threadId}:${parsed.typeId}:${openerUserId ?? ''}`;

  if (!isConfirm) {
    const row = buildConfirmRow(
      `${CLOSE_CONFIRM_PREFIX}${closePayload}`,
      `tickets:close-cancel:${parsed.threadId}`,
      ticketType.confirmCloseYes,
      ticketType.confirmCloseNo
    );

    await replyEphemeral(interaction, {
      content: ticketType.confirmClosePrompt,
      components: [row],
    });
    return;
  }

  if (!canCloseTicket(interaction, openerUserId, ticketType.staffRoleIds)) {
    await replyEphemeral(interaction, t.noPermission);
    return;
  }

  await interaction.deferUpdate();

  try {
    await finalizeTicketClose(thread, parsed.typeId, ticketType, ticketType.ticketClosed);
  } catch (err) {
    console.error('[tickets] Failed to close ticket:', err);
    await replyEphemeral(interaction, t.closeError);
  }
}

export async function handleCloseCancel(interaction: ButtonInteraction): Promise<void> {
  await interaction.update({
    content: texts().closeCancelled,
    components: [],
  });
}
