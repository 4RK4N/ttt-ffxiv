import { type ButtonInteraction } from 'discord.js';
import { isModuleEnabled } from '../../core/texts.js';
import { replyEphemeral } from '../../core/discordInteractions.js';
import { isOnCooldown, touchCooldown } from './cooldown.js';
import { formatEphemeralMessage } from './respond.js';
import { tryAssignRole, tryRemoveRole } from './roles.js';
import { BTN_PREFIX } from './panel.js';
import { isActivePanelMessage } from './guards.js';
import { resolveOption, resolvePanel, texts, NAMESPACE, type ResolvedRolePanel } from './types.js';

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

async function replySuccess(
  interaction: ButtonInteraction,
  panel: ResolvedRolePanel,
  roleName: string
): Promise<void> {
  const message = formatEphemeralMessage(panel, {
    mention: `<@${interaction.user.id}>`,
    role: roleName,
  });
  if (message) {
    await replyEphemeral(interaction, message);
  }
}

export async function handleButtonInteraction(interaction: ButtonInteraction): Promise<void> {
  const t = texts();

  if (!isModuleEnabled(NAMESPACE)) {
    await replyEphemeral(interaction, t.disabled);
    return;
  }

  const parsed = parseButtonCustomId(interaction.customId);
  if (!parsed) {
    await replyEphemeral(interaction, t.invalidInteraction);
    return;
  }

  const panel = resolvePanel(parsed.panelId);
  if (!panel || !panel.published) {
    await replyEphemeral(interaction, t.panelUnpublished);
    return;
  }

  if (panel.reactionType !== 'button') {
    await replyEphemeral(interaction, t.invalidInteraction);
    return;
  }

  if (
    !isActivePanelMessage(
      panel,
      interaction.channelId,
      interaction.message.id
    )
  ) {
    await replyEphemeral(interaction, t.invalidInteraction);
    return;
  }

  const option = resolveOption(panel, parsed.optionId);
  if (!option || !option.roleId.trim()) {
    await replyEphemeral(interaction, t.invalidInteraction);
    return;
  }

  if (!interaction.guild) {
    await replyEphemeral(interaction, t.roleError);
    return;
  }

  if (isOnCooldown(interaction.user.id, panel.id)) return;
  touchCooldown(interaction.user.id, panel.id);

  const guildMember = await interaction.guild.members.fetch(interaction.user.id);
  const hasRole = guildMember.roles.cache.has(option.roleId);
  const roleName = interaction.guild.roles.cache.get(option.roleId)?.name ?? 'role';

  await interaction.deferUpdate();

  if (panel.toggleable) {
    const result = hasRole
      ? await tryRemoveRole(guildMember, option.roleId)
      : await tryAssignRole(guildMember, option.roleId);
    if (!result.ok) {
      await replyEphemeral(
        interaction,
        result.reason === 'hierarchy' ? t.roleHierarchyError : t.roleError
      );
      return;
    }
    await replySuccess(interaction, panel, roleName);
    return;
  }

  if (!hasRole) {
    const result = await tryAssignRole(guildMember, option.roleId);
    if (!result.ok) {
      await replyEphemeral(
        interaction,
        result.reason === 'hierarchy' ? t.roleHierarchyError : t.roleError
      );
      return;
    }
    await replySuccess(interaction, panel, roleName);
  }
}
