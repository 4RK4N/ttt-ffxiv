export function parsePanelBaseFields(configRow, textRow) {
    return {
        id: typeof configRow.id === "string" ? configRow.id : "",
        published: configRow.published === true,
        panelMessageId: typeof configRow.panelMessageId === "string"
            ? configRow.panelMessageId
            : "",
        channelId: typeof configRow.channelId === "string" ? configRow.channelId : "",
        panelTitle: typeof textRow.panelTitle === "string" ? textRow.panelTitle : "",
        panelDescription: typeof textRow.panelDescription === "string"
            ? textRow.panelDescription
            : "",
    };
}
//# sourceMappingURL=panelFields.js.map