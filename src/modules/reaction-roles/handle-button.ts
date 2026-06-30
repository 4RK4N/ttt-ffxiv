import { MessageFlags, type ButtonInteraction } from 'discord.js';
import { isModuleEnabled } from '../../core/texts.js';
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

async function replyError(interaction: ButtonInteraction, content: string): Promise<void> {
  if (interaction.deferred || interaction.replied) {
    await interaction.followUp({ flags: MessageFlags.Ephemeral, content });
    return;
  }
  await interaction.reply({ flags: MessageFlags.Ephemeral, content });
}

export async function handleButtonInteraction(interaction: ButtonInteraction): Promise<void> {
  const t = texts();

  if (!isModuleEnabled(NAMESPACE)) {
    await replyError(interaction, t.disabled);
    return;
  }

  const parsed = parseButtonCustomId(interaction.customId);
  if (!parsed) {
    await replyError(interaction, t.invalidInteraction);
    return;
  }

  const panel = resolvePanel(parsed.panelId);
  if (!panel || !panel.published) {
    await replyError(interaction, t.panelUnpublished);
    return;
  }

  if (panel.reactionType !== 'button') {
    await replyError(interaction, t.invalidInteraction);
    return;
  }

  if (
    !isActivePanelMessage(
      panel,
      interaction.channelId,
      interaction.message.id
    )
  ) {
    await replyError(interaction, t.invalidInteraction);
    return;
  }

  const option = resolveOption(panel, parsed.optionId);
  if (!option || !option.roleId.trim()) {
    await replyError(interaction, t.invalidInteraction);
    return;
  }

  if (!interaction.guild) {
    await replyError(interaction, t.roleError);
    return;
  }

  const guildMember = await interaction.guild.members.fetch(interaction.user.id);
  const hasRole = guildMember.roles.cache.has(option.roleId);

  await interaction.deferUpdate();

  if (panel.toggleable) {
    const result = hasRole
      ? await tryRemoveRole(guildMember, option.roleId)
      : await tryAssignRole(guildMember, option.roleId);
    if (!result.ok) {
      await replyError(
        interaction,
        result.reason === 'hierarchy' ? t.roleHierarchyError : t.roleError
      );
    }
    return;
  }

  if (!hasRole) {
    const result = await tryAssignRole(guildMember, option.roleId);
    if (!result.ok) {
      await replyError(
        interaction,
        result.reason === 'hierarchy' ? t.roleHierarchyError : t.roleError
      );
    }
  }
}
