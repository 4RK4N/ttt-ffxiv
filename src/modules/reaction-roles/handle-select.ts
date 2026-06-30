import { MessageFlags, type StringSelectMenuInteraction } from 'discord.js';
import { isModuleEnabled } from '../../core/texts.js';
import { formatEphemeralMessage } from './respond.js';
import { memberHasPanelRole, tryAssignRole, tryRemoveRole } from './roles.js';
import { SEL_PREFIX } from './panel.js';
import { resolvePanel, texts, NAMESPACE } from './types.js';

function parseSelectCustomId(customId: string): string | null {
  if (!customId.startsWith(SEL_PREFIX)) return null;
  const panelId = customId.slice(SEL_PREFIX.length);
  return panelId || null;
}

export async function handleSelectInteraction(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const t = texts();

  if (!isModuleEnabled(NAMESPACE)) {
    await interaction.editReply(t.disabled);
    return;
  }

  const panelId = parseSelectCustomId(interaction.customId);
  if (!panelId) {
    await interaction.editReply(t.invalidInteraction);
    return;
  }

  const panel = resolvePanel(panelId);
  if (!panel || !panel.published) {
    await interaction.editReply(t.panelUnpublished);
    return;
  }

  if (panel.reactionType !== 'dropdown') {
    await interaction.editReply(t.invalidInteraction);
    return;
  }

  const guildMember = await interaction.guild?.members.fetch(interaction.user.id);
  if (!guildMember) {
    await interaction.editReply(t.roleError);
    return;
  }

  const validOptionIds = new Set(panel.roleOptions.map((o) => o.id));
  const selected = interaction.values.filter((v) => validOptionIds.has(v));

  const panelRoleIds = panel.roleOptions.map((o) => o.roleId).filter(Boolean);

  if (!panel.toggleable && memberHasPanelRole(guildMember, panelRoleIds)) {
    const message = formatEphemeralMessage(panel, {
      mention: `<@${interaction.user.id}>`,
      role: '',
    });
    await interaction.editReply(message ?? '\u200b');
    return;
  }

  const changedRoleNames: string[] = [];

  for (const opt of panel.roleOptions) {
    if (!opt.roleId.trim()) continue;
    const isSelected = selected.includes(opt.id);
    const hasRole = guildMember.roles.cache.has(opt.roleId);

    if (panel.toggleable) {
      if (isSelected && !hasRole) {
        const result = await tryAssignRole(guildMember, opt.roleId);
        if (!result.ok) {
          await interaction.editReply(result.reason === 'hierarchy' ? t.roleHierarchyError : t.roleError);
          return;
        }
        const name = interaction.guild?.roles.cache.get(opt.roleId)?.name;
        if (name) changedRoleNames.push(name);
      } else if (!isSelected && hasRole) {
        const result = await tryRemoveRole(guildMember, opt.roleId);
        if (!result.ok) {
          await interaction.editReply(result.reason === 'hierarchy' ? t.roleHierarchyError : t.roleError);
          return;
        }
        const name = interaction.guild?.roles.cache.get(opt.roleId)?.name;
        if (name) changedRoleNames.push(name);
      }
    } else if (isSelected && !hasRole) {
      const result = await tryAssignRole(guildMember, opt.roleId);
      if (!result.ok) {
        await interaction.editReply(result.reason === 'hierarchy' ? t.roleHierarchyError : t.roleError);
        return;
      }
      const name = interaction.guild?.roles.cache.get(opt.roleId)?.name;
      if (name) changedRoleNames.push(name);
    }
  }

  const message = formatEphemeralMessage(panel, {
    mention: `<@${interaction.user.id}>`,
    role: changedRoleNames.join(', '),
  });

  await interaction.editReply(message ?? '\u200b');
}
