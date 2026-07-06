import { assertSnowflake } from "../../core/discordIds.js";
import { emojiMatchKey } from "../../core/discordEmoji.js";
import { MAX_PANEL_OPTIONS } from "../../core/limits.js";
import { parsePanelBaseFields } from "../../core/panelFields.js";
import { isReactionType, normalizeRoleOptions, type ReactionType, type ResolvedRolePanel } from "./types.js";

const MAX_OPTIONS = MAX_PANEL_OPTIONS;

export function validateRolePanel(panel: ResolvedRolePanel): void {
  if (!isReactionType(panel.reactionType)) {
    throw new Error(
      `Invalid reaction type "${String(panel.reactionType)}". Must be one of: button, emoji, dropdown, dropdown-single.`,
    );
  }

  if (panel.channelId.trim()) {
    assertSnowflake(panel.channelId, "Channel ID");
  }

  const count = panel.roleOptions.length;
  if (count < 1 || count > MAX_OPTIONS) {
    throw new Error(
      `Panel must have 1–${MAX_OPTIONS} role options (has ${count}).`,
    );
  }
  if (panel.reactionType === "emoji") {
    const seenEmoji = new Set<string>();
    for (const opt of panel.roleOptions) {
      if (!opt.emoji.trim()) {
        throw new Error(
          `Emoji is required for option "${opt.label || opt.id}" in emoji mode.`,
        );
      }
      if (!opt.roleId.trim()) {
        throw new Error(
          `Role is required for option "${opt.label || opt.id}" in emoji mode.`,
        );
      }
      assertSnowflake(opt.roleId, `Option "${opt.label || opt.id}" role ID`);
      const key = emojiMatchKey(opt.emoji);
      if (key && seenEmoji.has(key)) {
        throw new Error(
          `Duplicate emoji "${opt.emoji.trim()}" — each option must use a different emoji in emoji reaction mode.`,
        );
      }
      if (key) seenEmoji.add(key);
    }
  }
  if (
    panel.reactionType === "button" ||
    panel.reactionType === "dropdown" ||
    panel.reactionType === "dropdown-single"
  ) {
    for (const opt of panel.roleOptions) {
      if (!opt.label.trim()) {
        throw new Error(
          `Label is required for option "${opt.id}" in ${panel.reactionType} mode.`,
        );
      }
      if (!opt.roleId.trim()) {
        throw new Error(`Role is required for option "${opt.id}".`);
      }
      assertSnowflake(opt.roleId, `Option "${opt.id}" role ID`);
    }
  }
}

export function validateRolePanelRow(
  configRow: Record<string, unknown>,
  textRow: Record<string, unknown>,
): void {
  const rawType = configRow.reactionType;
  const reactionType: ReactionType = isReactionType(rawType)
    ? rawType
    : "button";
  if (rawType !== undefined && rawType !== null && !isReactionType(rawType)) {
    throw new Error(
      `Invalid reaction type "${String(rawType)}". Must be one of: button, emoji, dropdown, dropdown-single.`,
    );
  }
  const base = parsePanelBaseFields(configRow, textRow);
  const panel: ResolvedRolePanel = {
    ...base,
    reactionType,
    toggleable: configRow.toggleable !== false,
    roleOptions: normalizeRoleOptions(configRow.roleOptions),
    ephemeralMessage:
      typeof textRow.ephemeralMessage === "string"
        ? textRow.ephemeralMessage
        : "",
  };
  validateRolePanel(panel);
}
