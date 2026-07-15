import { MessageFlags, PermissionFlagsBits, } from "discord.js";
import { isModuleEnabled } from "#shared/core/texts.js";
/** Discord API: unknown message (already deleted). */
export function isDiscordUnknownMessage(err) {
    return (typeof err === "object" &&
        err !== null &&
        err.code === 10008);
}
/** Defers an ephemeral slash-command reply, then runs the handler. */
export async function deferEphemeral(interaction, handler) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    await handler(interaction);
}
/** Ephemeral user feedback; uses followUp after deferUpdate/deferReply. */
export async function replyEphemeral(interaction, options) {
    const payload = typeof options === "string"
        ? { content: options, flags: MessageFlags.Ephemeral }
        : { ...options, flags: MessageFlags.Ephemeral };
    if (interaction.deferred || interaction.replied) {
        await interaction.followUp(payload);
        return;
    }
    await interaction.reply(payload);
}
/** True when the member holds at least one of the given role IDs. */
export function memberHasAnyRole(member, roleIds) {
    return roleIds.some((id) => member.roles.cache.has(id));
}
/** Configured role ID or guild Administrator. */
export function canConfiguredRoleOrAdmin(member, roleId) {
    if (member.permissions.has(PermissionFlagsBits.Administrator))
        return true;
    const id = roleId?.trim();
    if (!id)
        return false;
    return member.roles.cache.has(id);
}
/** After deferReply: if module is disabled, editReply with message and return false. */
export async function guardEnabledSlash(interaction, namespace, disabledMessage) {
    if (isModuleEnabled(namespace))
        return true;
    await interaction.editReply(disabledMessage);
    return false;
}
//# sourceMappingURL=discordInteractions.js.map