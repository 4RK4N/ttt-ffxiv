import { type ButtonInteraction } from "discord.js";
import { replyEphemeral } from "../../lib/core/discordInteractions.js";
import { tryAssignRole, tryRemoveRole } from "../../lib/core/discordRoles.js";
import { isOnCooldown, touchCooldown } from "./cooldown.js";
import { guardPublishedPanel } from "./guards.js";
import { parseButtonCustomId } from "./parsers.js";
import { formatEphemeralMessage, replyRoleResult } from "./respond.js";
import {
  resolveOption,
  texts,
} from "../../lib/modules/reaction-roles/config-io.js";
import type { ResolvedRolePanel } from "../../../../shared/modules/reaction-roles/types.js";

async function replySuccess(
  interaction: ButtonInteraction,
  panel: ResolvedRolePanel,
  roleName: string,
): Promise<void> {
  const message = formatEphemeralMessage(panel, {
    mention: `<@${interaction.user.id}>`,
    role: roleName,
  });
  if (message) {
    await replyEphemeral(interaction, message);
  }
}

export async function handleButtonInteraction(
  interaction: ButtonInteraction,
): Promise<void> {
  const parsed = parseButtonCustomId(interaction.customId);
  if (!parsed) {
    await replyEphemeral(interaction, texts().invalidInteraction);
    return;
  }

  const guarded = await guardPublishedPanel(interaction, parsed.panelId, {
    reactionType: "button",
    requireGuild: true,
  });
  if (!guarded.ok) return;

  const { panel, t } = guarded;

  const option = resolveOption(panel, parsed.optionId);
  if (!option || !option.roleId.trim()) {
    await replyEphemeral(interaction, t.invalidInteraction);
    return;
  }

  if (isOnCooldown(interaction.user.id, panel.id)) {
    await replyEphemeral(interaction, t.cooldown);
    return;
  }
  touchCooldown(interaction.user.id, panel.id);

  const guildMember = await interaction.guild!.members.fetch(
    interaction.user.id,
  );
  const hasRole = guildMember.roles.cache.has(option.roleId);
  const roleName =
    interaction.guild!.roles.cache.get(option.roleId)?.name ?? "role";

  await interaction.deferUpdate();

  if (panel.toggleable) {
    const result = hasRole
      ? await tryRemoveRole(guildMember, option.roleId)
      : await tryAssignRole(guildMember, option.roleId);
    if (!(await replyRoleResult(interaction, result, t))) return;
    await replySuccess(interaction, panel, roleName);
    return;
  }

  if (!hasRole) {
    const result = await tryAssignRole(guildMember, option.roleId);
    if (!(await replyRoleResult(interaction, result, t))) return;
    await replySuccess(interaction, panel, roleName);
  }
}
