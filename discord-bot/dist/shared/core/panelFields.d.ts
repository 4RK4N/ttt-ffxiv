export interface PanelBaseFields {
    id: string;
    published: boolean;
    panelMessageId: string;
    channelId: string;
    panelTitle: string;
    panelDescription: string;
}
export declare function parsePanelBaseFields(configRow: Record<string, unknown>, textRow: Record<string, unknown>): PanelBaseFields;
//# sourceMappingURL=panelFields.d.ts.map