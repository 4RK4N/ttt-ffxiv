import { createListResolver, createModuleData, moduleDefaultsFromParts, } from "../../core/moduleConfig.js";
export const NAMESPACE = "reaction-roles";
export const REACTION_TYPES = [
    "button",
    "emoji",
    "dropdown",
    "dropdown-single",
];
export function isReactionType(value) {
    return (typeof value === "string" &&
        REACTION_TYPES.includes(value));
}
export function normalizeRoleOptions(raw) {
    if (!Array.isArray(raw))
        return [];
    return raw.filter((v) => typeof v === "object" && v !== null && typeof v.id === "string");
}
export const DEFAULT_PANEL_TEXTS = {
    panelTitle: "Role selection",
    panelDescription: "Pick your roles below.",
    ephemeralMessage: "",
};
export const TEXT_DEFAULTS = {
    disabled: "Reaction roles are currently disabled.",
    panelUnpublished: "This role panel is not available right now.",
    invalidInteraction: "This interaction does not match a valid role panel.",
    cooldown: "Please wait a moment before trying again.",
    roleError: "Could not update your roles. Please contact an administrator.",
    roleHierarchyError: "The bot cannot assign one or more of these roles.",
};
export const CONFIG_DEFAULTS = {
    enabled: true,
    panels: [],
};
export const MODULE_DEFAULTS = moduleDefaultsFromParts(CONFIG_DEFAULTS, TEXT_DEFAULTS);
const mod = createModuleData(NAMESPACE, MODULE_DEFAULTS);
export const get = mod.get;
export const data = mod.data;
export function resolvePanel(id) {
    return resolvePanelById(id);
}
const resolvePanelById = createListResolver({
    get,
    listKey: "panels",
    defaultTexts: DEFAULT_PANEL_TEXTS,
    normalize: (row) => ({
        ...DEFAULT_PANEL_TEXTS,
        ...row,
        reactionType: isReactionType(row.reactionType) ? row.reactionType : "button",
        toggleable: row.toggleable !== false,
        roleOptions: normalizeRoleOptions(row.roleOptions),
    }),
});
export function findPanelByMessageId(messageId) {
    for (const row of get("panels")) {
        if (row.published && row.panelMessageId === messageId) {
            return resolvePanel(row.id);
        }
    }
    return undefined;
}
export function resolveOption(panel, optionId) {
    return panel.roleOptions.find((o) => o.id === optionId);
}
//# sourceMappingURL=types.js.map