import { defineSimpleModule, optionalConfigString, } from "#shared/core/moduleConfig.js";
export const CONFIG_DEFAULTS = {
    channelId: "",
    rulesChannelId: "",
};
export const TEXT_DEFAULTS = {
    rulesMessage: [
        "🇬🇧 English",
        "Have a great time here in **Tiny Temptation Tubs**",
        "Please head over to {rulesChannel}",
        " and accept them to completely unlock the server for you (except NSFW that is optional).",
        "",
        "🇩🇪 Deutsch",
        "Viel Spass im **Tiny Temptation Tubs**",
        "Bitte lies dir die Regeln in {rulesChannel}",
        " durch und akzeptiere diese um den Server vollständig freizuschalten für dich (ausser NSFW dies ist optional).",
    ].join("\n"),
    welcomeContent: "Welcome {mention}",
    rulesChannelFallback: "{mention} please read and accept the rules in {rulesChannel} to fully unlock the server.",
};
const mod = defineSimpleModule({
    namespace: "welcome-message",
    configDefaults: CONFIG_DEFAULTS,
    textDefaults: TEXT_DEFAULTS,
});
export const MODULE_DEFAULTS = mod.MODULE_DEFAULTS;
export const NAMESPACE = mod.NAMESPACE;
export const get = mod.get;
export const data = mod.data;
export function welcomeChannelId() {
    return optionalConfigString(get("channelId"));
}
/** Clickable Discord channel link for {rulesChannel}, or empty when unset. */
export function rulesChannelLink(guildId) {
    const id = get("rulesChannelId").trim();
    if (id === "")
        return "";
    return `https://discord.com/channels/${guildId}/${id}`;
}
//# sourceMappingURL=types.js.map