export declare const MODULE_NAMESPACES: readonly ["welcome-message", "pic-repost-commands", "links-pics-vids-autothread", "tickets", "reaction-roles", "custom-embeds", "moderation-log", "emojis"];
export type ModuleNamespace = (typeof MODULE_NAMESPACES)[number];
export declare const APP_CONFIG_TABLE = "app_config";
export declare function moduleTableName(namespace: string): string;
export declare function namespaceFromTable(table: string): ModuleNamespace | undefined;
export declare function assertSafeTableName(table: string): void;
//# sourceMappingURL=moduleTable.d.ts.map