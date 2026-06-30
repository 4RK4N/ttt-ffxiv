import { getConfig, getTexts } from '../../core/texts.js';

export const NAMESPACE = 'reaction-roles';

export type ReactionType = 'button' | 'emoji' | 'dropdown' | 'dropdown-single';

export interface RoleOption {
  id: string;
  roleId: string;
  emoji: string;
  label: string;
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
  roleError: string;
  roleHierarchyError: string;
  panels: Record<string, RolePanelTexts>;
}

export const DEFAULT_PANEL_TEXTS: RolePanelTexts = {
  panelTitle: 'Role selection',
  panelDescription: 'Pick your roles below.',
  ephemeralMessage: '',
};

export const TEXT_DEFAULTS: ReactionRolesTexts = {
  disabled: 'Reaction roles are currently disabled.',
  panelUnpublished: 'This role panel is not available right now.',
  invalidInteraction: 'This interaction does not match a valid role panel.',
  roleError: 'Could not update your roles. Please contact an administrator.',
  roleHierarchyError: 'The bot cannot assign one or more of these roles.',
  panels: {},
};

export const CONFIG_DEFAULTS: ReactionRolesConfig = {
  enabled: true,
  panels: [],
};

export function config(): ReactionRolesConfig {
  return getConfig(NAMESPACE, CONFIG_DEFAULTS);
}

export function texts(): ReactionRolesTexts {
  return getTexts(NAMESPACE, TEXT_DEFAULTS);
}

export function resolvePanel(id: string): ResolvedRolePanel | undefined {
  const row = config().panels.find((p) => p.id === id);
  if (!row) return undefined;
  const copy = texts().panels[id] ?? DEFAULT_PANEL_TEXTS;
  return {
    ...row,
    ...copy,
    reactionType: row.reactionType ?? 'button',
    toggleable: row.toggleable !== false,
    roleOptions: Array.isArray(row.roleOptions) ? row.roleOptions : [],
  };
}

export function findPanelByMessageId(messageId: string): ResolvedRolePanel | undefined {
  for (const row of config().panels) {
    if (row.published && row.panelMessageId === messageId) {
      return resolvePanel(row.id);
    }
  }
  return undefined;
}

export function resolveOption(
  panel: ResolvedRolePanel,
  optionId: string
): RoleOption | undefined {
  return panel.roleOptions.find((o) => o.id === optionId);
}
