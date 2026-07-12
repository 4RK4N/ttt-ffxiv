import { createModuleConfig } from "../../../../../shared/core/moduleConfig.js";

export interface EmojisConfig {
  enabled?: boolean;
  emojiRoleId?: string;
}

export interface EmojisTexts {
  disabled: string;
  noPermission: string;
  invalidName: string;
  nameTaken: string;
  notImage: string;
  fileTooLarge: string;
  notCustomEmoji: string;
  downloadFailed: string;
  botMissingPermission: string;
  slotsFull: string;
  createFailed: string;
  addedSuccess: string;
}

export const CONFIG_DEFAULTS: EmojisConfig = {
  enabled: true,
  emojiRoleId: "",
};

export const TEXT_DEFAULTS: EmojisTexts = {
  disabled: "This command is currently disabled.",
  noPermission: "You do not have permission to manage server emojis.",
  invalidName:
    "Invalid emoji name. Use 2–32 characters: letters, numbers, and underscores only.",
  nameTaken: "An emoji with that name already exists on this server.",
  notImage: "The attachment must be an image file (PNG, JPEG, GIF, or WebP).",
  fileTooLarge:
    "That image is too large. Discord emojis must be 256 KiB or smaller.",
  notCustomEmoji:
    "Only custom emojis can be copied. Paste a custom emoji from another server (not a standard unicode emoji).",
  downloadFailed: "Could not download the image. Please try again.",
  botMissingPermission:
    "I do not have the Manage Emojis and Stickers permission in this server.",
  slotsFull:
    "This server has no remaining emoji slots. Remove an emoji or increase your boost level.",
  createFailed: "Could not create the emoji. Please try again.",
  addedSuccess: "Added {emoji} to this server.",
};

const module = createModuleConfig("emojis", CONFIG_DEFAULTS, TEXT_DEFAULTS);

export const NAMESPACE = module.NAMESPACE;
export const config = module.config;
export const texts = module.texts;

export function emojiRoleId(): string | undefined {
  const id = config().emojiRoleId?.trim();
  return id === "" ? undefined : id;
}
