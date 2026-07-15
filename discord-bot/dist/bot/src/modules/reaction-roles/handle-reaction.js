import { Events, } from "discord.js";
import { guardReactionEvent } from "../../lib/core/reactionContext.js";
import { registerSafeHandler } from "../../lib/core/discordEvents.js";
import { roleChangeErrorMessage, tryAssignRole, tryRemoveRole, } from "../../lib/core/discordRoles.js";
import { isOnCooldown, touchCooldown } from "./cooldown.js";
import { matchOptionByReaction } from "../../lib/modules/reaction-roles/panel.js";
import { data, findPanelByMessageId, NAMESPACE, } from "../../lib/modules/reaction-roles/config-io.js";
async function handleReaction(reaction, user, added) {
    const ctx = await guardReactionEvent(reaction, user, NAMESPACE);
    if (!ctx)
        return;
    const t = data();
    const { message, guild, reaction: fullReaction } = ctx;
    const panel = findPanelByMessageId(message.id);
    if (!panel || panel.reactionType !== "emoji")
        return;
    if (message.channelId !== panel.channelId)
        return;
    const emojiName = fullReaction.emoji.name;
    const emojiId = fullReaction.emoji.id;
    const option = matchOptionByReaction(panel.roleOptions, emojiName, emojiId);
    if (!option || !option.roleId.trim())
        return;
    if (isOnCooldown(user.id, panel.id))
        return;
    touchCooldown(user.id, panel.id);
    let member;
    try {
        member = await guild.members.fetch(user.id);
    }
    catch {
        return;
    }
    const hasRole = member.roles.cache.has(option.roleId);
    if (added) {
        if (hasRole)
            return;
        const result = await tryAssignRole(member, option.roleId);
        if (!result.ok) {
            console.warn(`[reaction-roles] Emoji add failed panel=${panel.id} user=${user.id} role=${option.roleId}: ${roleChangeErrorMessage(result, t.roleHierarchyError, t.roleError)}`);
            try {
                await fullReaction.users.remove(user.id);
            }
            catch {
                // best effort — reaction may already be gone
            }
        }
        return;
    }
    // Unreact
    if (!panel.toggleable)
        return;
    if (!hasRole)
        return;
    const result = await tryRemoveRole(member, option.roleId);
    if (!result.ok) {
        console.warn(`[reaction-roles] Emoji remove failed panel=${panel.id} user=${user.id} role=${option.roleId}: ${roleChangeErrorMessage(result, t.roleHierarchyError, t.roleError)}`);
    }
}
export function registerReactionHandlers(client) {
    registerSafeHandler(client, Events.MessageReactionAdd, (reaction, user) => handleReaction(reaction, user, true), "[reaction-roles]");
    registerSafeHandler(client, Events.MessageReactionRemove, (reaction, user) => handleReaction(reaction, user, false), "[reaction-roles]");
}
//# sourceMappingURL=handle-reaction.js.map