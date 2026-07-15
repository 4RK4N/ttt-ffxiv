export declare const NAMESPACE = "custom-embeds";
export interface EmbedPanelConfig {
    id: string;
    published: boolean;
    panelMessageId: string;
    channelId: string;
    showTimestamp: boolean;
}
export interface EmbedPanelTexts {
    panelTitle: string;
    panelDescription: string;
    authorName: string;
    authorIconUrl: string;
    footer: string;
}
export interface ResolvedEmbedPanel extends EmbedPanelConfig, EmbedPanelTexts {
}
export interface CustomEmbedsConfig {
    enabled?: boolean;
    panels: EmbedPanelConfig[];
}
export declare const DEFAULT_PANEL_TEXTS: EmbedPanelTexts;
export declare const CONFIG_DEFAULTS: CustomEmbedsConfig;
export type CustomEmbedsModuleData = CustomEmbedsConfig;
export declare const MODULE_DEFAULTS: CustomEmbedsModuleData;
export declare const get: <K extends keyof CustomEmbedsConfig>(key: K) => CustomEmbedsConfig[K];
export declare const data: () => CustomEmbedsConfig;
export declare function resolveEmbedPanel(id: string): ResolvedEmbedPanel | undefined;
//# sourceMappingURL=types.d.ts.map