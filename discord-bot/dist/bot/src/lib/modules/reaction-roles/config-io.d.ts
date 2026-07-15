import { type RolePanelConfig } from "#shared/modules/reaction-roles/types.js";
export * from "#shared/modules/reaction-roles/types.js";
export declare const updateRolePanel: (id: string, patch: Partial<RolePanelConfig>) => Promise<RolePanelConfig | undefined>;
export declare const getRolePanelConfig: (id: string) => RolePanelConfig | undefined;
//# sourceMappingURL=config-io.d.ts.map