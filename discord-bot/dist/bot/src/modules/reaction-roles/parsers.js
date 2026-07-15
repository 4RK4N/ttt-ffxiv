import { BTN_PREFIX, SEL_PREFIX } from "../../lib/modules/reaction-roles/panel.js";
export function parseButtonCustomId(customId) {
    if (!customId.startsWith(BTN_PREFIX))
        return null;
    const rest = customId.slice(BTN_PREFIX.length);
    const sep = rest.lastIndexOf(":");
    if (sep === -1)
        return null;
    const panelId = rest.slice(0, sep);
    const optionId = rest.slice(sep + 1);
    if (!panelId || !optionId)
        return null;
    return { panelId, optionId };
}
export function parseSelectCustomId(customId) {
    if (!customId.startsWith(SEL_PREFIX))
        return null;
    const panelId = customId.slice(SEL_PREFIX.length);
    return panelId || null;
}
//# sourceMappingURL=parsers.js.map