import { assertSnowflake } from "../../core/discordIds.js";
import { parsePanelBaseFields } from "../../core/panelFields.js";
function isHttpUrl(value) {
    try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
    }
    catch {
        return false;
    }
}
export function validateEmbedPanel(panel) {
    if (!panel.panelDescription.trim()) {
        throw new Error("Embed description is required.");
    }
    const iconUrl = panel.authorIconUrl.trim();
    const authorName = panel.authorName.trim();
    if (iconUrl && !authorName) {
        throw new Error("Author name is required when an author icon URL is set.");
    }
    if (iconUrl && !isHttpUrl(iconUrl)) {
        throw new Error("Author icon URL must be a valid http or https URL.");
    }
    if (panel.channelId.trim()) {
        assertSnowflake(panel.channelId, "Channel ID");
    }
}
export function validateEmbedPanelRow(configRow, textRow) {
    const base = parsePanelBaseFields(configRow, textRow);
    const panel = {
        ...base,
        showTimestamp: configRow.showTimestamp === true,
        authorName: typeof textRow.authorName === "string" ? textRow.authorName : "",
        authorIconUrl: typeof textRow.authorIconUrl === "string" ? textRow.authorIconUrl : "",
        footer: typeof textRow.footer === "string" ? textRow.footer : "",
    };
    validateEmbedPanel(panel);
}
//# sourceMappingURL=validate.js.map