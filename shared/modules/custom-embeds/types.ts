import {
  createModuleData,
  findListItemById,
} from "../../core/moduleConfig.js";

export const NAMESPACE = "custom-embeds";

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

export interface ResolvedEmbedPanel extends EmbedPanelConfig, EmbedPanelTexts { }

export interface CustomEmbedsConfig {
  enabled?: boolean;
  panels: EmbedPanelConfig[];
}

export const DEFAULT_PANEL_TEXTS: EmbedPanelTexts = {
  panelTitle: "",
  panelDescription: "",
  authorName: "",
  authorIconUrl: "",
  footer: "",
};

export const CONFIG_DEFAULTS: CustomEmbedsConfig = {
  enabled: true,
  panels: [],
};

export type CustomEmbedsModuleData = CustomEmbedsConfig;

export const MODULE_DEFAULTS: CustomEmbedsModuleData = { ...CONFIG_DEFAULTS };

const mod = createModuleData(NAMESPACE, MODULE_DEFAULTS);

export const get = mod.get;
export const data = mod.data;

export function resolveEmbedPanel(id: string): ResolvedEmbedPanel | undefined {
  const row = findListItemById(
    get("panels") as Array<EmbedPanelConfig & Partial<EmbedPanelTexts>>,
    id,
  );
  if (!row) return undefined;
  return {
    ...DEFAULT_PANEL_TEXTS,
    ...row,
    showTimestamp: row.showTimestamp === true,
  } as ResolvedEmbedPanel;
}
