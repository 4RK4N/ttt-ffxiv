import { createListResolver, createModuleData, } from "../../core/moduleConfig.js";
export const NAMESPACE = "custom-embeds";
export const DEFAULT_PANEL_TEXTS = {
    panelTitle: "",
    panelDescription: "",
    authorName: "",
    authorIconUrl: "",
    footer: "",
};
export const CONFIG_DEFAULTS = {
    enabled: true,
    panels: [],
};
export const MODULE_DEFAULTS = { ...CONFIG_DEFAULTS };
const mod = createModuleData(NAMESPACE, MODULE_DEFAULTS);
export const get = mod.get;
export const data = mod.data;
export function resolveEmbedPanel(id) {
    return resolveEmbedPanelById(id);
}
const resolveEmbedPanelById = createListResolver({
    get,
    listKey: "panels",
    defaultTexts: DEFAULT_PANEL_TEXTS,
    normalize: (row) => ({
        ...DEFAULT_PANEL_TEXTS,
        ...row,
        showTimestamp: row.showTimestamp === true,
    }),
});
//# sourceMappingURL=types.js.map