import {
  MessageFlags,
  type ButtonInteraction,
  type GuildMember,
  type ThreadChannel,
} from 'discord.js';
import { format, isModuleEnabled } from '../../core/texts.js';
import { tryAssignRole } from '../reaction-roles/roles.js';
import { finalizeTicketClose, resolveOpenerUserId } from './finalize-close.js';
import { isClosedTicketThread } from './names.js';
import { ROLE_ACTION_PREFIX } from './panel.js';
import { canStaffOrAdmin } from './permissions.js';
import { resolveTicketType, texts, NAMESPACE } from './types.js';

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

  const ticketType = resolveTicketType(parsed.typeId);
  const t = texts();

  if (!isModuleEnabled(NAMESPACE)) {
    await interaction.reply({ content: t.disabled, flags: MessageFlags.Ephemeral });
    return;
  }

  if (!ticketType || !ticketType.roleActionRoleId) {
    await interaction.reply({
      content: t.categoryUnpublished,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const thread = interaction.channel;
  if (!thread?.isThread()) {
    await interaction.reply({
      content: t.threadContextRequired,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (parsed.threadId !== thread.id) {
    await interaction.reply({
      content: t.invalidInteraction,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (isClosedTicketThread(thread.name, thread.locked === true)) {
    await interaction.reply({
      content: t.invalidInteraction,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const member = interaction.member as GuildMember | null;
  if (!member || !canStaffOrAdmin(member, ticketType.staffRoleIds)) {
    await interaction.deferUpdate();
    return;
  }

  const openerUserId = await resolveOpenerUserId(thread, parsed.openerUserId);
  if (!openerUserId) {
    await interaction.reply({
      content: t.roleActionOpenerMissing,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const guild = thread.guild;
  const openerMember = await guild.members.fetch(openerUserId).catch(() => null);
  if (!openerMember) {
    await interaction.reply({
      content: t.roleActionOpenerMissing,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const roleId = ticketType.roleActionRoleId;
  const role = guild.roles.cache.get(roleId);
  const result = await tryAssignRole(openerMember, roleId);

  if (!result.ok) {
    const message =
      result.reason === 'hierarchy' ? t.roleActionHierarchyError : t.roleActionError;
    await interaction.reply({ content: message, flags: MessageFlags.Ephemeral });
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
    await interaction.followUp({
      content: t.closeError,
      flags: MessageFlags.Ephemeral,
    });
  }
}
