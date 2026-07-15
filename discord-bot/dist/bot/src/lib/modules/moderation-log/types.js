import { defineSimpleModule, optionalConfigString, } from "#shared/core/moduleConfig.js";
export const TEXT_DEFAULTS = {
    messageDeleted: "🗑️ Message sent by {author} deleted in {channel}",
    messageDeletedEmpty: "[no text content]",
    authorUnknown: "Unknown user",
    memberLeft: "📤 {mention} has left the server",
    memberKicked: "👮 {mention} has been kicked by {executorId}",
    memberBanned: "👮 🔒 {mention} has been banned by {executorId}",
    memberUnbanned: "🔓 {mention} has been unbanned by {executorId}",
    executorUnknown: "Unknown",
    footerMessageId: "Message ID: {messageId}",
    footerUserId: "ID: {userId}",
};
export const CONFIG_DEFAULTS = {
    channelId: "",
    logMessageDeleted: true,
    logMemberLeft: true,
    logMemberKicked: true,
    logMemberBanned: true,
    logMemberUnbanned: true,
};
const mod = defineSimpleModule({
    namespace: "moderation-log",
    configDefaults: CONFIG_DEFAULTS,
    textDefaults: TEXT_DEFAULTS,
});
export const MODULE_DEFAULTS = mod.MODULE_DEFAULTS;
export const NAMESPACE = mod.NAMESPACE;
export const get = mod.get;
export const data = mod.data;
export function logChannelId() {
    return optionalConfigString(get("channelId"));
}
//# sourceMappingURL=types.js.map