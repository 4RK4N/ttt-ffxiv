import {
  type ButtonInteraction,
  type GuildMember,
  type ThreadChannel,
} from 'discord.js';
import { replyEphemeral } from '../../core/discordInteractions.js';
import { format } from '../../core/texts.js';
import { tryAssignRole } from '../../core/discordRoles.js';
import { finalizeTicketClose, resolveOpenerUserId } from './finalize-close.js';
import { guardTicketThreadAction } from './guards.js';
import { ROLE_ACTION_PREFIX } from './panel.js';
import { canStaffOrAdmin } from './permissions.js';

interface ParsedRoleActionCustomId {
  threadId: string;
  typeId: string;
  openerUserId?: string;
}

function parseRoleActionCustomId(customId: string): ParsedRoleActionCustomId | null {
  if (!customId.startsWith(ROLE_ACTION_PREFIX)) return null;

  const segments = customId.slice(ROLE_ACTION_PREFIX.length).split(':');
  if (segments.length < 3) return null;

  return { threadId: segments[0], typeId: segments[1], openerUserId: segments[2] };
}

export async function handleRoleAction(interaction: ButtonInteraction): Promise<void> {
  const parsed = parseRoleActionCustomId(interaction.customId);
  if (!parsed) return;

  const guarded = await guardTicketThreadAction(
    interaction,
    parsed.typeId,
    parsed.threadId,
    { requireOpen: true }
  );
  if (!guarded.ok) return;

  const { ticketType, thread, t } = guarded.ctx;

  if (!ticketType.roleActionRoleId) {
    await replyEphemeral(interaction, t.categoryUnpublished);
    return;
  }

  const member = interaction.member as GuildMember | null;
  if (!member || !canStaffOrAdmin(member, ticketType.staffRoleIds)) {
    await replyEphemeral(interaction, t.noPermission);
    return;
  }

  const openerUserId = await resolveOpenerUserId(thread, parsed.openerUserId);
  if (!openerUserId) {
    await replyEphemeral(interaction, t.roleActionOpenerMissing);
    return;
  }

  const guild = thread.guild;
  const openerMember = await guild.members.fetch(openerUserId).catch(() => null);
  if (!openerMember) {
    await replyEphemeral(interaction, t.roleActionOpenerMissing);
    return;
  }

  const roleId = ticketType.roleActionRoleId;
  const role = guild.roles.cache.get(roleId);
  const result = await tryAssignRole(openerMember, roleId);

  if (!result.ok) {
    const message =
      result.reason === 'hierarchy' ? t.roleActionHierarchyError : t.roleActionError;
    await replyEphemeral(interaction, message);
    return;
  }

  await interaction.deferUpdate();

  try {
    const confirmation = format(ticketType.roleActionConfirmation, {
      mention: `<@${openerUserId}>`,
      role: role?.name ?? 'role',
    });
    await finalizeTicketClose(thread as ThreadChannel, parsed.typeId, ticketType, confirmation);
  } catch (err) {
    console.error('[tickets] Failed to complete role action:', err);
    await replyEphemeral(interaction, t.closeError);
  }
}
