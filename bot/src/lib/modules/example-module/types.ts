/**
 * Module types, defaults, and config/text accessors.
 *
 * This is the single source of truth for:
 * - TypeScript interfaces matching data/<namespace>/config.json and texts.json
 * - Code defaults (used when files are missing or malformed)
 * - `config()` and `texts()` — cached, hot-reloading reads
 *
 * Handlers should import via config-io.ts, not directly from here (see config-io.ts).
 *
 * Web editor writes call invalidateModuleCache() — config() / texts() pick up changes
 * without restart.
 */
import { createModuleConfig } from "../../../../../shared/core/moduleConfig.js";

// =============================================================================
// SIMPLE MODULE (default — delete panel section below if unused)
// =============================================================================

export interface ExampleConfig {
  /** Master on/off; also toggled in web editor. Only explicit `false` disables. */
  enabled?: boolean;
  /** Discord channel snowflake. Empty string = feature idle (see targetChannelId()). */
  channelId: string;
}

export interface ExampleTexts {
  /** Shown when the module is disabled via config.enabled or web toggle. */
  disabled: string;
  /** Supports {mention} — substitute with format() from core/texts.js. */
  greeting: string;
}

export const CONFIG_DEFAULTS: ExampleConfig = {
  enabled: true,
  channelId: "",
};

export const TEXT_DEFAULTS: ExampleTexts = {
  disabled: "This feature is currently disabled.",
  greeting: "Hello {mention}!",
};

const module = createModuleConfig(
  "example-module",
  CONFIG_DEFAULTS,
  TEXT_DEFAULTS,
);

export const NAMESPACE = module.NAMESPACE;
export const config = module.config;
export const texts = module.texts;

/** Normalized config helper — prefer small named accessors over raw config() in handlers. */
export function targetChannelId(): string | undefined {
  const id = config().channelId.trim();
  return id === "" ? undefined : id;
}

// =============================================================================
// PANEL MODULE (optional — uncomment entire block for publishable list items)
// =============================================================================
//
// Panel modules store a *list* of items in config.json (e.g. panels[]) and nest
// per-item copy in texts.json (e.g. texts.panels[id]). Use resolveKeyedItem()
// to merge config row + text row into one object for handlers and publish.
//
// Also add validate.ts and wire validateExamplePanelRow in web-admin/src/store.ts.
//
/*
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

export interface ResolvedExamplePanel extends ExamplePanelConfig, ExamplePanelTexts {}

export interface ExamplePanelModuleConfig extends ExampleConfig {
  panels: ExamplePanelConfig[];
}

export interface ExamplePanelModuleTexts extends ExampleTexts {
  panels: Record<string, ExamplePanelTexts>;
}

export const DEFAULT_PANEL_TEXTS: ExamplePanelTexts = {
  panelTitle: 'Example panel',
  panelDescription: 'Configure me in the web editor.',
};

// Replace CONFIG_DEFAULTS / TEXT_DEFAULTS and re-run createModuleConfig if converting
// this template to a panel module:

export const PANEL_CONFIG_DEFAULTS: ExamplePanelModuleConfig = {
  enabled: true,
  channelId: '',
  panels: [],
};

export const PANEL_TEXT_DEFAULTS: ExamplePanelModuleTexts = {
  disabled: 'This feature is currently disabled.',
  greeting: 'Hello {mention}!',
  panels: {},
};

export function resolveExamplePanel(id: string): ResolvedExamplePanel | undefined {
  return resolveKeyedItem(
    config().panels as ExamplePanelConfig[],
    id,
    (texts() as ExamplePanelModuleTexts).panels,
    DEFAULT_PANEL_TEXTS
  );
}
*/
