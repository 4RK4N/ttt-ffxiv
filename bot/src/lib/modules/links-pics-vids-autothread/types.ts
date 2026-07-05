import { createModuleConfig } from "../../../../../shared/core/moduleConfig.js";
import { DEFAULT_THREAD_FIRST_MESSAGE } from "../../core/threads.js";

export interface AutoThreadTexts {
  threadFirstMessage: string;
}

export interface AutoThreadConfig {
  // Channel IDs where the bot auto-creates a comments thread on qualifying posts.
  channelIds: string[];
}

export const CONFIG_DEFAULTS: AutoThreadConfig = {
  channelIds: [],
};

export const TEXT_DEFAULTS: AutoThreadTexts = {
  threadFirstMessage: DEFAULT_THREAD_FIRST_MESSAGE,
};

const module = createModuleConfig(
  "links-pics-vids-autothread",
  CONFIG_DEFAULTS,
  TEXT_DEFAULTS,
);

export const NAMESPACE = module.NAMESPACE;
export const config = module.config;
export const texts = module.texts;

export function channelIds(): string[] {
  return config().channelIds;
}
