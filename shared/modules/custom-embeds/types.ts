import {
  createModuleConfig,
  resolveKeyedItem,
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

export interface CustomEmbedsTexts {
  panels: Record<string, EmbedPanelTexts>;
}

export const DEFAULT_PANEL_TEXTS: EmbedPanelTexts = {
  panelTitle: "",
  panelDescription: "",
  authorName: "",
  authorIconUrl: "",
  footer: "",
};

export const TEXT_DEFAULTS: CustomEmbedsTexts = {
  panels: {},
};

export const CONFIG_DEFAULTS: CustomEmbedsConfig = {
  enabled: true,
  panels: [],
};

const module = createModuleConfig(NAMESPACE, CONFIG_DEFAULTS, TEXT_DEFAULTS);

export const config = module.config;
export const texts = module.texts;

export function resolveEmbedPanel(id: string): ResolvedEmbedPanel | undefined {
  return resolveKeyedItem(
    config().panels,
    id,
    texts().panels,
    DEFAULT_PANEL_TEXTS,
    (row: EmbedPanelConfig, copy: EmbedPanelTexts) => ({
      ...row,
      ...copy,
      showTimestamp: row.showTimestamp === true,
    }),
  );
}
