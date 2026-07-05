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

// --- Panel module (optional) --------------------------------------------------
// Copy bot/src/examples/module-template/panel-types.ts → shared/modules/<name>/types.ts
// Copy validate.ts → shared/modules/<name>/validate.ts; wire store.ts + publishRegistry.ts
// Uncomment panel block in config-io.ts; implement panel.ts + publisher.ts
