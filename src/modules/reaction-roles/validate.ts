import { emojiMatchKey } from '../../core/discordEmoji.js';
import { MAX_PANEL_OPTIONS } from '../../core/limits.js';
import { parsePanelBaseFields } from '../../core/panelFields.js';
import type { ReactionType, ResolvedRolePanel, RoleOption } from './types.js';

const MAX_OPTIONS = MAX_PANEL_OPTIONS;

function normalizeRoleOptions(raw: unknown): RoleOption[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((v): v is RoleOption => typeof v === 'object' && v !== null && typeof v.id === 'string');
}

export function validateRolePanel(panel: ResolvedRolePanel): void {
  const count = panel.roleOptions.length;
  if (count < 1 || count > MAX_OPTIONS) {
    throw new Error(`Panel must have 1–${MAX_OPTIONS} role options (has ${count}).`);
  }
  if (panel.reactionType === 'emoji') {
    const seenEmoji = new Set<string>();
    for (const opt of panel.roleOptions) {
      if (!opt.emoji.trim()) {
        throw new Error(`Emoji is required for option "${opt.label || opt.id}" in emoji mode.`);
      }
      if (!opt.roleId.trim()) {
        throw new Error(`Role is required for option "${opt.label || opt.id}" in emoji mode.`);
      }
      const key = emojiMatchKey(opt.emoji);
      if (key && seenEmoji.has(key)) {
        throw new Error(
          `Duplicate emoji "${opt.emoji.trim()}" — each option must use a different emoji in emoji reaction mode.`
        );
      }
      if (key) seenEmoji.add(key);
    }
  }
  if (
    panel.reactionType === 'button' ||
    panel.reactionType === 'dropdown' ||
    panel.reactionType === 'dropdown-single'
  ) {
    for (const opt of panel.roleOptions) {
      if (!opt.label.trim()) {
        throw new Error(`Label is required for option "${opt.id}" in ${panel.reactionType} mode.`);
      }
      if (!opt.roleId.trim()) {
        throw new Error(`Role is required for option "${opt.id}".`);
      }
    }
  }
}

export function validateRolePanelRow(
  configRow: Record<string, unknown>,
  textRow: Record<string, unknown>
): void {
  const reactionType = (configRow.reactionType as ReactionType) ?? 'button';
  const base = parsePanelBaseFields(configRow, textRow);
  const panel: ResolvedRolePanel = {
    ...base,
    reactionType,
    toggleable: configRow.toggleable !== false,
    roleOptions: normalizeRoleOptions(configRow.roleOptions),
    ephemeralMessage: typeof textRow.ephemeralMessage === 'string' ? textRow.ephemeralMessage : '',
  };
  validateRolePanel(panel);
}
