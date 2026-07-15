import { type EmbedPanelConfig } from "#shared/modules/custom-embeds/types.js";
export * from "#shared/modules/custom-embeds/types.js";
export declare const updateEmbedPanel: (id: string, patch: Partial<EmbedPanelConfig>) => Promise<EmbedPanelConfig | undefined>;
export declare const getEmbedPanelConfig: (id: string) => EmbedPanelConfig | undefined;
//# sourceMappingURL=config-io.d.ts.map