/**
 * Panel module types — copy to `shared/modules/<name>/types.ts` when creating a panel
 * module. Simple modules keep types in `bot/src/lib/modules/<name>/types.ts` instead.
 *
 * Not compiled in-place (see bot/tsconfig.json exclude) — imports assume destination
 * under shared/modules/<name>/.
 *
 * After copying: uncomment the panel block in `bot/src/lib/modules/<name>/config-io.ts`.
 */
import {
  createModuleConfig,
  resolveKeyedItem,
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
  extends ExamplePanelConfig,
  ExamplePanelTexts { }

export interface ExamplePanelModuleConfig {
  enabled?: boolean;
  channelId: string;
  panels: ExamplePanelConfig[];
}

export interface ExamplePanelModuleTexts {
  disabled: string;
  greeting: string;
  panels: Record<string, ExamplePanelTexts>;
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
  panels: {},
};

const module = createModuleConfig(NAMESPACE, CONFIG_DEFAULTS, TEXT_DEFAULTS);

export const config = module.config;
export const texts = module.texts;

export function resolveExamplePanel(
  id: string,
): ResolvedExamplePanel | undefined {
  return resolveKeyedItem(
    config().panels,
    id,
    texts().panels,
    DEFAULT_PANEL_TEXTS,
  );
}
