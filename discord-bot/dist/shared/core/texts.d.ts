/** Resolves a path inside a module's data folder: data/<namespace>/<segments>. */
export declare function moduleDataPath(namespace: string, ...segments: string[]): string;
/**
 * Replaces `{token}` placeholders in a template with the provided values.
 * Unknown tokens are left untouched.
 */
export declare function format(template: string, vars: Record<string, string | number>): string;
export declare function getModuleRowsSync(namespace: string): Record<string, unknown>;
export declare function getModuleDataSync<T extends object>(namespace: string, defaults: T): T;
export declare function reloadModuleStore(namespace: string): Promise<void>;
export declare function reloadAllModuleStores(namespaces: string[]): Promise<void>;
export declare function isModuleEnabled(namespace: string): boolean;
//# sourceMappingURL=texts.d.ts.map