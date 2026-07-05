import { createModuleConfig } from "../../../../../shared/core/moduleConfig.js";

export interface WelcomeTexts {
  rulesMessage: string;
  welcomeContent: string;
  rulesChannelFallback: string;
}

export interface WelcomeConfig {
  // Channel where the welcome card is posted when a member joins. Empty disables it.
  channelId: string;
  // Channel linked from the rules message via the {rulesChannel} token.
  rulesChannelId: string;
}

export const CONFIG_DEFAULTS: WelcomeConfig = {
  channelId: "",
  rulesChannelId: "",
};

// Code defaults; data/welcome-message/texts.json overrides these (editable source
// of truth). The discord.com channel link renders as a clickable channel mention.
export const TEXT_DEFAULTS: WelcomeTexts = {
  rulesMessage: [
    "🇬🇧 English",
    "Have a great time here in **Tiny Temptation Tubs**",
    "Please head over to {rulesChannel}",
    " and accept them to completely unlock the server for you (except NSFW that is optional).",
    "",
    "🇩🇪 Deutsch",
    "Viel Spass im **Tiny Temptation Tubs**",
    "Bitte lies dir die Regeln in {rulesChannel}",
    " durch und akzeptiere diese um den Server vollständig freizuschalten für dich (ausser NSFW dies ist optional).",
  ].join("\n"),
  welcomeContent: "Welcome {mention}",
  rulesChannelFallback:
    "{mention} please read and accept the rules in {rulesChannel} to fully unlock the server.",
};

const module = createModuleConfig(
  "welcome-message",
  CONFIG_DEFAULTS,
  TEXT_DEFAULTS,
);

export const NAMESPACE = module.NAMESPACE;
export const config = module.config;
export const texts = module.texts;

export function welcomeChannelId(): string | undefined {
  const id = config().channelId.trim();
  return id === "" ? undefined : id;
}

/** Clickable Discord channel link for {rulesChannel}, or empty when unset. */
export function rulesChannelLink(guildId: string): string {
  const id = config().rulesChannelId.trim();
  if (id === "") return "";
  return `https://discord.com/channels/${guildId}/${id}`;
}
