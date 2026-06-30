import { MessageFlags, type StringSelectMenuInteraction } from 'discord.js';
import { isModuleEnabled } from '../../core/texts.js';
import { memberHasPanelRole, tryAssignRole, tryRemoveRole } from './roles.js';
import { SEL_PREFIX } from './panel.js';
import { isActivePanelMessage } from './guards.js';
import { resolvePanel, texts, NAMESPACE } from './types.js';

function parseSelectCustomId(customId: string): string | null {
  if (!customId.startsWith(SEL_PREFIX)) return null;
  const panelId = customId.slice(SEL_PREFIX.length);
  return panelId || null;
}

function isDropdownType(reactionType: string): boolean {
  return reactionType === 'dropdown' || reactionType === 'dropdown-single';
}

async function replyError(
  interaction: StringSelectMenuInteraction,
  content: string
): Promise<void> {
  if (interaction.deferred || interaction.replied) {
    await interaction.followUp({ flags: MessageFlags.Ephemeral, content });
    return;
  }
  await interaction.reply({ flags: MessageFlags.Ephemeral, content });
}

export async function handleSelectInteraction(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const t = texts();

  if (!isModuleEnabled(NAMESPACE)) {
    await replyError(interaction, t.disabled);
    return;
  }

  const panelId = parseSelectCustomId(interaction.customId);
  if (!panelId) {
    await replyError(interaction, t.invalidInteraction);
    return;
  }

  const panel = resolvePanel(panelId);
  if (!panel || !panel.published) {
    await replyError(interaction, t.panelUnpublished);
    return;
  }

  if (!isDropdownType(panel.reactionType)) {
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

  const guildMember = await interaction.guild?.members.fetch(interaction.user.id);
  if (!guildMember) {
    await replyError(interaction, t.roleError);
    return;
  }

  const validOptionIds = new Set(panel.roleOptions.map((o) => o.id));
  const selected = interaction.values.filter((v) => validOptionIds.has(v));
  const panelRoleIds = panel.roleOptions.map((o) => o.roleId).filter(Boolean);

  if (!panel.toggleable && memberHasPanelRole(guildMember, panelRoleIds)) {
    await interaction.deferUpdate();
    return;
  }

  await interaction.deferUpdate();

  for (const opt of panel.roleOptions) {
    if (!opt.roleId.trim()) continue;
    const isSelected = selected.includes(opt.id);
    const hasRole = guildMember.roles.cache.has(opt.roleId);

    if (panel.toggleable) {
      if (isSelected && !hasRole) {
        const result = await tryAssignRole(guildMember, opt.roleId);
        if (!result.ok) {
          await replyError(
            interaction,
            result.reason === 'hierarchy' ? t.roleHierarchyError : t.roleError
          );
          return;
        }
      } else if (!isSelected && hasRole) {
        const result = await tryRemoveRole(guildMember, opt.roleId);
        if (!result.ok) {
          await replyError(
            interaction,
            result.reason === 'hierarchy' ? t.roleHierarchyError : t.roleError
          );
          return;
        }
      }
    } else if (isSelected && !hasRole) {
      const result = await tryAssignRole(guildMember, opt.roleId);
      if (!result.ok) {
        await replyError(
          interaction,
          result.reason === 'hierarchy' ? t.roleHierarchyError : t.roleError
        );
        return;
      }
    }
  }
}
