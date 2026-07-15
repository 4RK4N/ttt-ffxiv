export declare const NAMESPACE = "reaction-roles";
export type ReactionType = "button" | "emoji" | "dropdown" | "dropdown-single";
export declare const REACTION_TYPES: readonly ReactionType[];
export declare function isReactionType(value: unknown): value is ReactionType;
export interface RoleOption {
    id: string;
    roleId: string;
    emoji: string;
    label: string;
}
export declare function normalizeRoleOptions(raw: unknown): RoleOption[];
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
export interface ResolvedRolePanel extends RolePanelConfig, RolePanelTexts {
}
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
export declare const DEFAULT_PANEL_TEXTS: RolePanelTexts;
export declare const TEXT_DEFAULTS: ReactionRolesTexts;
export declare const CONFIG_DEFAULTS: ReactionRolesConfig;
export type ReactionRolesModuleData = ReactionRolesConfig & ReactionRolesTexts;
export declare const MODULE_DEFAULTS: ReactionRolesModuleData;
export declare const get: <K extends keyof ReactionRolesConfig | keyof ReactionRolesTexts>(key: K) => ReactionRolesModuleData[K];
export declare const data: () => ReactionRolesModuleData;
export declare function resolvePanel(id: string): ResolvedRolePanel | undefined;
export declare function findPanelByMessageId(messageId: string): ResolvedRolePanel | undefined;
export declare function resolveOption(panel: ResolvedRolePanel, optionId: string): RoleOption | undefined;
//# sourceMappingURL=types.d.ts.map