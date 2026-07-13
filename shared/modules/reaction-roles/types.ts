import {
  createModuleData,
  findListItemById,
  moduleDefaultsFromParts,
} from "../../core/moduleConfig.js";

export const NAMESPACE = "reaction-roles";

export type ReactionType = "button" | "emoji" | "dropdown" | "dropdown-single";

export const REACTION_TYPES: readonly ReactionType[] = [
  "button",
  "emoji",
  "dropdown",
  "dropdown-single",
] as const;

export function isReactionType(value: unknown): value is ReactionType {
  return (
    typeof value === "string" &&
    (REACTION_TYPES as readonly string[]).includes(value)
  );
}

export interface RoleOption {
  id: string;
  roleId: string;
  emoji: string;
  label: string;
}

export function normalizeRoleOptions(raw: unknown): RoleOption[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (v): v is RoleOption =>
      typeof v === "object" && v !== null && typeof v.id === "string",
  );
}

export interface RolePanelConfig {
  id: string;
  published: boolean;
  panelMessageId: string;
  channelId: string;
  reactionType: ReactionType;
  toggleable: boolean;
  roleOptions: RoleOption[];
}

export interface RolePanelTexts {
  panelTitle: string;
  panelDescription: string;
  ephemeralMessage: string;
}

export interface ResolvedRolePanel extends RolePanelConfig, RolePanelTexts { }

export interface ReactionRolesConfig {
  enabled?: boolean;
  panels: RolePanelConfig[];
}

export interface ReactionRolesTexts {
  disabled: string;
  panelUnpublished: string;
  invalidInteraction: string;
  cooldown: string;
  roleError: string;
  roleHierarchyError: string;
}

export const DEFAULT_PANEL_TEXTS: RolePanelTexts = {
  panelTitle: "Role selection",
  panelDescription: "Pick your roles below.",
  ephemeralMessage: "",
};

export const TEXT_DEFAULTS: ReactionRolesTexts = {
  disabled: "Reaction roles are currently disabled.",
  panelUnpublished: "This role panel is not available right now.",
  invalidInteraction: "This interaction does not match a valid role panel.",
  cooldown: "Please wait a moment before trying again.",
  roleError: "Could not update your roles. Please contact an administrator.",
  roleHierarchyError: "The bot cannot assign one or more of these roles.",
};

export const CONFIG_DEFAULTS: ReactionRolesConfig = {
  enabled: true,
  panels: [],
};

export type ReactionRolesModuleData = ReactionRolesConfig & ReactionRolesTexts;

export const MODULE_DEFAULTS: ReactionRolesModuleData = moduleDefaultsFromParts(
  CONFIG_DEFAULTS,
  TEXT_DEFAULTS,
);

const mod = createModuleData(NAMESPACE, MODULE_DEFAULTS);

export const get = mod.get;
export const data = mod.data;

export function resolvePanel(id: string): ResolvedRolePanel | undefined {
  const row = findListItemById(
    get("panels") as Array<RolePanelConfig & Partial<RolePanelTexts>>,
    id,
  );
  if (!row) return undefined;
  return {
    ...DEFAULT_PANEL_TEXTS,
    ...row,
    reactionType: isReactionType(row.reactionType) ? row.reactionType : "button",
    toggleable: row.toggleable !== false,
    roleOptions: normalizeRoleOptions(row.roleOptions),
  } as ResolvedRolePanel;
}

export function findPanelByMessageId(
  messageId: string,
): ResolvedRolePanel | undefined {
  for (const row of get("panels")) {
    if (row.published && row.panelMessageId === messageId) {
      return resolvePanel(row.id);
    }
  }
  return undefined;
}

export function resolveOption(
  panel: ResolvedRolePanel,
  optionId: string,
): RoleOption | undefined {
  return panel.roleOptions.find((o) => o.id === optionId);
}
