import { type StringSelectMenuInteraction } from "discord.js";
import {
  memberHasAnyRole,
  replyEphemeral,
} from "../../lib/core/discordInteractions.js";
import {
  fetchPanelGuildMember,
  guardPanelCooldown,
  guardPublishedPanel,
} from "./guards.js";
import { formatEphemeralMessage } from "./respond.js";
import { parseSelectCustomId } from "./parsers.js";
import { get } from "../../lib/modules/reaction-roles/config-io.js";
import { applyDropdownRoleSelection } from "./role-selection.js";

export async function handleSelectInteraction(
  interaction: StringSelectMenuInteraction,
): Promise<void> {
  const panelId = parseSelectCustomId(interaction.customId);
  if (!panelId) {
    await replyEphemeral(interaction, get("invalidInteraction"));
    return;
  }

  const guarded = await guardPublishedPanel(interaction, panelId, {
    reactionType: ["dropdown", "dropdown-single"],
  });
  if (!guarded.ok) return;

  const { panel, t } = guarded;

  const guildMember = await fetchPanelGuildMember(interaction, t.roleError);
  if (!guildMember) return;

  if (!(await guardPanelCooldown(interaction, panel.id, t.cooldown))) return;

  const validOptionIds = new Set(panel.roleOptions.map((o) => o.id));
  const selected = interaction.values.filter((v) => validOptionIds.has(v));
  const panelRoleIds = panel.roleOptions.map((o) => o.roleId).filter(Boolean);

  if (!panel.toggleable && memberHasAnyRole(guildMember, panelRoleIds)) {
    await interaction.deferUpdate();
    return;
  }

  await interaction.deferUpdate();

  try {
    const { changedRoleNames } = await applyDropdownRoleSelection({
      member: guildMember,
      panel,
      selectedOptionIds: selected,
      guild: interaction.guild,
      texts: t,
    });

    const message = formatEphemeralMessage(panel, {
      mention: `<@${interaction.user.id}>`,
      role: changedRoleNames.join(", "),
    });
    if (message) {
      await replyEphemeral(interaction, message);
    }
  } catch (err) {
    console.error("[reaction-roles] Dropdown role selection failed:", err);
    await replyEphemeral(interaction, t.roleError);
  }
}
