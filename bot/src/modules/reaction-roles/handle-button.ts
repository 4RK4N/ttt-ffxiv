import { type ButtonInteraction } from 'discord.js';
import { replyEphemeral } from '../../../../shared/core/discordInteractions.js';
import { tryAssignRole, tryRemoveRole } from '../../../../shared/core/discordRoles.js';
import { isOnCooldown, touchCooldown } from './cooldown.js';
import { guardPublishedPanel } from './guards.js';
import { formatEphemeralMessage } from './respond.js';
import { BTN_PREFIX } from '../../../../shared/modules/reaction-roles/panel.js';
import { resolveOption, texts } from '../../../../shared/modules/reaction-roles/config-io.js';
import type { ResolvedRolePanel } from '../../../../shared/modules/reaction-roles/types.js';

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
  const parsed = parseButtonCustomId(interaction.customId);
  if (!parsed) {
    await replyEphemeral(interaction, texts().invalidInteraction);
    return;
  }

  const guarded = await guardPublishedPanel(interaction, parsed.panelId, {
    reactionType: 'button',
    requireGuild: true,
  });
  if (!guarded.ok) return;

  const { panel, t } = guarded;

  const option = resolveOption(panel, parsed.optionId);
  if (!option || !option.roleId.trim()) {
    await replyEphemeral(interaction, t.invalidInteraction);
    return;
  }

  if (isOnCooldown(interaction.user.id, panel.id)) return;
  touchCooldown(interaction.user.id, panel.id);

  const guildMember = await interaction.guild!.members.fetch(interaction.user.id);
  const hasRole = guildMember.roles.cache.has(option.roleId);
  const roleName = interaction.guild!.roles.cache.get(option.roleId)?.name ?? 'role';

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
