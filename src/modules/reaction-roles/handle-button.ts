import { MessageFlags, type ButtonInteraction } from 'discord.js';
import { isModuleEnabled } from '../../core/texts.js';
import { formatEphemeralMessage } from './respond.js';
import { tryAssignRole, tryRemoveRole } from './roles.js';
import { BTN_PREFIX } from './panel.js';
import { isActivePanelMessage } from './guards.js';
import { resolveOption, resolvePanel, texts, NAMESPACE } from './types.js';

function parseButtonCustomId(customId: string): { panelId: string; optionId: string } | null {
  if (!customId.startsWith(BTN_PREFIX)) return null;
  const rest = customId.slice(BTN_PREFIX.length);
  const sep = rest.lastIndexOf(':');
  if (sep === -1) return null;
  const panelId = rest.slice(0, sep);
  const optionId = rest.slice(sep + 1);
  if (!panelId || !optionId) return null;
  return { panelId, optionId };
}

export async function handleButtonInteraction(interaction: ButtonInteraction): Promise<void> {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const t = texts();

  if (!isModuleEnabled(NAMESPACE)) {
    await interaction.editReply(t.disabled);
    return;
  }

  const parsed = parseButtonCustomId(interaction.customId);
  if (!parsed) {
    await interaction.editReply(t.invalidInteraction);
    return;
  }

  const panel = resolvePanel(parsed.panelId);
  if (!panel || !panel.published) {
    await interaction.editReply(t.panelUnpublished);
    return;
  }

  if (panel.reactionType !== 'button') {
    await interaction.editReply(t.invalidInteraction);
    return;
  }

  if (
    !isActivePanelMessage(
      panel,
      interaction.channelId,
      interaction.message.id
    )
  ) {
    await interaction.editReply(t.invalidInteraction);
    return;
  }

  const option = resolveOption(panel, parsed.optionId);
  if (!option || !option.roleId.trim()) {
    await interaction.editReply(t.invalidInteraction);
    return;
  }

  if (!interaction.guild) {
    await interaction.editReply(t.roleError);
    return;
  }

  const guildMember = await interaction.guild.members.fetch(interaction.user.id);

  const hasRole = guildMember.roles.cache.has(option.roleId);

  if (panel.toggleable) {
    const result = hasRole
      ? await tryRemoveRole(guildMember, option.roleId)
      : await tryAssignRole(guildMember, option.roleId);
    if (!result.ok) {
      await interaction.editReply(result.reason === 'hierarchy' ? t.roleHierarchyError : t.roleError);
      return;
    }
  } else if (!hasRole) {
    const result = await tryAssignRole(guildMember, option.roleId);
    if (!result.ok) {
      await interaction.editReply(result.reason === 'hierarchy' ? t.roleHierarchyError : t.roleError);
      return;
    }
  }

  const roleName = interaction.guild.roles.cache.get(option.roleId)?.name ?? 'role';
  const message = formatEphemeralMessage(panel, {
    mention: `<@${interaction.user.id}>`,
    role: roleName,
  });

  if (message) {
    await interaction.editReply(message);
  } else {
    await interaction.editReply('\u200b');
  }
}
