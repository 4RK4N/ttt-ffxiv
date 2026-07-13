/**
 * Panel module types — copy to `shared/modules/<name>/types.ts` when creating a panel
 * module. Simple modules keep types in `bot/src/lib/modules/<name>/types.ts` instead.
 */
import {
  createModuleData,
  findListItemById,
  moduleDefaultsFromParts,
} from "../../core/moduleConfig.js";

export const NAMESPACE = "example-module";

export interface ExamplePanelConfig {
  id: string;
  published: boolean;
  panelMessageId: string;
  channelId: string;
}

export interface ExamplePanelTexts {
  panelTitle: string;
  panelDescription: string;
}

export interface ResolvedExamplePanel
  extends ExamplePanelConfig, ExamplePanelTexts { }

export interface ExamplePanelModuleConfig {
  enabled?: boolean;
  channelId: string;
  panels: ExamplePanelConfig[];
}

export interface ExamplePanelModuleTexts {
  disabled: string;
  greeting: string;
}

export const DEFAULT_PANEL_TEXTS: ExamplePanelTexts = {
  panelTitle: "Example panel",
  panelDescription: "Configure me in the web editor.",
};

export const CONFIG_DEFAULTS: ExamplePanelModuleConfig = {
  enabled: true,
  channelId: "",
  panels: [],
};

export const TEXT_DEFAULTS: ExamplePanelModuleTexts = {
  disabled: "This feature is currently disabled.",
  greeting: "Hello {mention}!",
};

export type ExamplePanelModuleData = ExamplePanelModuleConfig &
  ExamplePanelModuleTexts;

export const MODULE_DEFAULTS: ExamplePanelModuleData = moduleDefaultsFromParts(
  CONFIG_DEFAULTS,
  TEXT_DEFAULTS,
);

const mod = createModuleData(NAMESPACE, MODULE_DEFAULTS);

export const get = mod.get;
export const data = mod.data;

export function resolveExamplePanel(
  id: string,
): ResolvedExamplePanel | undefined {
  const row = findListItemById(
    get("panels") as Array<ExamplePanelConfig & Partial<ExamplePanelTexts>>,
    id,
  );
  if (!row) return undefined;
  return { ...DEFAULT_PANEL_TEXTS, ...row } as ResolvedExamplePanel;
}
