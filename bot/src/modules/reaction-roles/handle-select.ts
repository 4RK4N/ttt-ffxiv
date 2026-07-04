import { type GuildMember, type StringSelectMenuInteraction } from 'discord.js';
import { memberHasAnyRole, replyEphemeral } from '../../../../shared/core/discordInteractions.js';
import { tryAssignRole, tryRemoveRole } from '../../../../shared/core/discordRoles.js';
import { isOnCooldown, touchCooldown } from './cooldown.js';
import { guardPublishedPanel } from './guards.js';
import { formatEphemeralMessage } from './respond.js';
import { SEL_PREFIX } from '../../../../shared/modules/reaction-roles/panel.js';
import { texts } from '../../../../shared/modules/reaction-roles/config-io.js';

function parseSelectCustomId(customId: string): string | null {
  if (!customId.startsWith(SEL_PREFIX)) return null;
  const panelId = customId.slice(SEL_PREFIX.length);
  return panelId || null;
}

type AppliedChange = { roleId: string; action: 'add' | 'remove' };

async function rollbackChanges(member: GuildMember, applied: AppliedChange[]): Promise<void> {
  for (let i = applied.length - 1; i >= 0; i--) {
    const { roleId, action } = applied[i];
    if (action === 'add') await tryRemoveRole(member, roleId);
    else await tryAssignRole(member, roleId);
  }
}

export async function handleSelectInteraction(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const panelId = parseSelectCustomId(interaction.customId);
  if (!panelId) {
    await replyEphemeral(interaction, texts().invalidInteraction);
    return;
  }

  const guarded = await guardPublishedPanel(interaction, panelId, {
    reactionType: ['dropdown', 'dropdown-single'],
  });
  if (!guarded.ok) return;

  const { panel, t } = guarded;

  const guildMember = await interaction.guild?.members.fetch(interaction.user.id);
  if (!guildMember) {
    await replyEphemeral(interaction, t.roleError);
    return;
  }

  if (isOnCooldown(interaction.user.id, panel.id)) return;
  touchCooldown(interaction.user.id, panel.id);

  const validOptionIds = new Set(panel.roleOptions.map((o) => o.id));
  const selected = interaction.values.filter((v) => validOptionIds.has(v));
  const panelRoleIds = panel.roleOptions.map((o) => o.roleId).filter(Boolean);

  if (!panel.toggleable && memberHasAnyRole(guildMember, panelRoleIds)) {
    await interaction.deferUpdate();
    return;
  }

  await interaction.deferUpdate();

  const applied: AppliedChange[] = [];
  const changedRoleNames: string[] = [];

  try {
    for (const opt of panel.roleOptions) {
      if (!opt.roleId.trim()) continue;
      const isSelected = selected.includes(opt.id);
      const hasRole = guildMember.roles.cache.has(opt.roleId);

      if (panel.toggleable) {
        if (isSelected && !hasRole) {
          const result = await tryAssignRole(guildMember, opt.roleId);
          if (!result.ok) {
            throw new Error(result.reason === 'hierarchy' ? t.roleHierarchyError : t.roleError);
          }
          applied.push({ roleId: opt.roleId, action: 'add' });
          const name = interaction.guild?.roles.cache.get(opt.roleId)?.name;
          if (name) changedRoleNames.push(name);
        } else if (!isSelected && hasRole) {
          const result = await tryRemoveRole(guildMember, opt.roleId);
          if (!result.ok) {
            throw new Error(result.reason === 'hierarchy' ? t.roleHierarchyError : t.roleError);
          }
          applied.push({ roleId: opt.roleId, action: 'remove' });
          const name = interaction.guild?.roles.cache.get(opt.roleId)?.name;
          if (name) changedRoleNames.push(name);
        }
      } else if (isSelected && !hasRole) {
        const result = await tryAssignRole(guildMember, opt.roleId);
        if (!result.ok) {
          throw new Error(result.reason === 'hierarchy' ? t.roleHierarchyError : t.roleError);
        }
        applied.push({ roleId: opt.roleId, action: 'add' });
        const name = interaction.guild?.roles.cache.get(opt.roleId)?.name;
        if (name) changedRoleNames.push(name);
      }
    }
  } catch (err) {
    await rollbackChanges(guildMember, applied);
    const message = err instanceof Error ? err.message : t.roleError;
    await replyEphemeral(interaction, message);
    return;
  }

  const message = formatEphemeralMessage(panel, {
    mention: `<@${interaction.user.id}>`,
    role: changedRoleNames.join(', '),
  });
  if (message) {
    await replyEphemeral(interaction, message);
  }
}
