import { createModuleConfig } from "../../../../../shared/core/moduleConfig.js";
import { DEFAULT_THREAD_FIRST_MESSAGE } from "../../core/threads.js";

const DEFAULT_NON_QUALIFYING_DM =
  "Hi! Your message in {channel} was removed because this channel is for images, videos, and supported post links only. Please comment in the thread under an existing post instead of posting in the channel.\n\n" +
  "Hallo! Deine Nachricht in {channel} wurde entfernt, weil dieser Channel nur für Bilder, Videos und unterstützte Post-Links gedacht ist. Bitte kommentiere im Thread unter einem bestehenden Post, statt im Channel zu schreiben.";

export interface AutoThreadTexts {
  threadFirstMessage: string;
  nonQualifyingDm: string;
}

export interface AutoThreadConfig {
  // Channel IDs where the bot auto-creates a comments thread on qualifying posts.
  channelIds: string[];
  /** When true, delete non-qualifying posts and DM the author. Default off. */
  deleteNonQualifyingMessages?: boolean;
}

export const CONFIG_DEFAULTS: AutoThreadConfig = {
  channelIds: [],
  deleteNonQualifyingMessages: false,
};

export const TEXT_DEFAULTS: AutoThreadTexts = {
  threadFirstMessage: DEFAULT_THREAD_FIRST_MESSAGE,
  nonQualifyingDm: DEFAULT_NON_QUALIFYING_DM,
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

export function deleteNonQualifyingMessagesEnabled(cfg = config()): boolean {
  return cfg.deleteNonQualifyingMessages === true;
}
