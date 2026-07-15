import { replyEphemeral } from "../../lib/core/discordInteractions.js";
import { tryAssignRole, tryRemoveRole } from "../../lib/core/discordRoles.js";
import { fetchPanelGuildMember, guardPanelCooldown, guardPublishedPanel, } from "./guards.js";
import { parseButtonCustomId } from "./parsers.js";
import { formatEphemeralMessage, replyRoleResult } from "./respond.js";
import { resolveOption, get, } from "../../lib/modules/reaction-roles/config-io.js";
async function replySuccess(interaction, panel, roleName) {
    const message = formatEphemeralMessage(panel, {
        mention: `<@${interaction.user.id}>`,
        role: roleName,
    });
    if (message) {
        await replyEphemeral(interaction, message);
    }
}
export async function handleButtonInteraction(interaction) {
    const parsed = parseButtonCustomId(interaction.customId);
    if (!parsed) {
        await replyEphemeral(interaction, get("invalidInteraction"));
        return;
    }
    const guarded = await guardPublishedPanel(interaction, parsed.panelId, {
        reactionType: "button",
        requireGuild: true,
    });
    if (!guarded.ok)
        return;
    const { panel, t } = guarded;
    const option = resolveOption(panel, parsed.optionId);
    if (!option || !option.roleId.trim()) {
        await replyEphemeral(interaction, t.invalidInteraction);
        return;
    }
    if (!(await guardPanelCooldown(interaction, panel.id, t.cooldown)))
        return;
    const guildMember = await fetchPanelGuildMember(interaction, t.roleError);
    if (!guildMember)
        return;
    const hasRole = guildMember.roles.cache.has(option.roleId);
    const roleName = interaction.guild.roles.cache.get(option.roleId)?.name ?? "role";
    await interaction.deferUpdate();
    if (panel.toggleable) {
        const result = hasRole
            ? await tryRemoveRole(guildMember, option.roleId)
            : await tryAssignRole(guildMember, option.roleId);
        if (!(await replyRoleResult(interaction, result, t)))
            return;
        await replySuccess(interaction, panel, roleName);
        return;
    }
    if (!hasRole) {
        const result = await tryAssignRole(guildMember, option.roleId);
        if (!(await replyRoleResult(interaction, result, t)))
            return;
        await replySuccess(interaction, panel, roleName);
    }
}
//# sourceMappingURL=handle-button.js.map