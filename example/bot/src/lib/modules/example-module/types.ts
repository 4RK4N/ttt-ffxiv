/**
 * Module types, defaults, and DB-backed accessors.
 *
 * Handlers should import via config-io.ts, not directly from here.
 * Panel modules: use shared/modules/<name>/types.ts instead (see example/shared/).
 */
import {
  defineSimpleModule,
  optionalConfigString,
} from "@shared/core/moduleConfig.js";

export interface ExampleConfig {
  enabled?: boolean;
  channelId: string;
}

export interface ExampleTexts {
  disabled: string;
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

export type ExampleModuleData = ExampleConfig & ExampleTexts;

const mod = defineSimpleModule({
  namespace: "example-module",
  configDefaults: CONFIG_DEFAULTS,
  textDefaults: TEXT_DEFAULTS,
});

export const MODULE_DEFAULTS = mod.MODULE_DEFAULTS;
export const NAMESPACE = mod.NAMESPACE;
export const get = mod.get;
export const data = mod.data;

export function targetChannelId(): string | undefined {
  return optionalConfigString(get("channelId"));
}
