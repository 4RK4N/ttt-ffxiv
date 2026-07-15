import { replyEphemeral } from "../../lib/core/discordInteractions.js";
import { isModuleEnabled } from "#shared/core/texts.js";
import { isOnCooldown, touchCooldown } from "./cooldown.js";
import { NAMESPACE, resolvePanel, data, } from "../../lib/modules/reaction-roles/config-io.js";
function matchesReactionType(panel, allowed) {
    const types = Array.isArray(allowed) ? allowed : [allowed];
    return types.includes(panel.reactionType);
}
/** Shared preamble for button/select interactions on a published role panel. */
export async function guardPublishedPanel(interaction, panelId, options) {
    const t = data();
    if (!isModuleEnabled(NAMESPACE)) {
        await replyEphemeral(interaction, t.disabled);
        return { ok: false };
    }
    const panel = resolvePanel(panelId);
    if (!panel || !panel.published) {
        await replyEphemeral(interaction, t.panelUnpublished);
        return { ok: false };
    }
    if (!matchesReactionType(panel, options.reactionType)) {
        await replyEphemeral(interaction, t.invalidInteraction);
        return { ok: false };
    }
    if (!isActivePanelMessage(panel, interaction.channelId, interaction.message.id)) {
        await replyEphemeral(interaction, t.invalidInteraction);
        return { ok: false };
    }
    if (options.requireGuild && !interaction.guild) {
        await replyEphemeral(interaction, t.roleError);
        return { ok: false };
    }
    return { ok: true, panel, t };
}
/** True when the interaction is on the panel's current published message. */
export function isActivePanelMessage(panel, channelId, messageId) {
    if (!panel.panelMessageId || !messageId)
        return false;
    if (panel.panelMessageId !== messageId)
        return false;
    if (panel.channelId && channelId && panel.channelId !== channelId)
        return false;
    return true;
}
/** Fetches the interacting guild member; replies with roleError when missing. */
export async function fetchPanelGuildMember(interaction, roleError) {
    const guildMember = await interaction.guild?.members.fetch(interaction.user.id);
    if (!guildMember) {
        await replyEphemeral(interaction, roleError);
        return null;
    }
    return guildMember;
}
/** Enforces per-user panel cooldown; replies with cooldown text when active. */
export async function guardPanelCooldown(interaction, panelId, cooldownText) {
    if (isOnCooldown(interaction.user.id, panelId)) {
        await replyEphemeral(interaction, cooldownText);
        return false;
    }
    touchCooldown(interaction.user.id, panelId);
    return true;
}
//# sourceMappingURL=guards.js.map