/** Merges config + text defaults for DB seeding and store fallbacks. */
export declare function moduleDefaultsFromParts<TConfig extends object, TTexts extends object>(configDefaults: TConfig, textDefaults: TTexts): TConfig & TTexts;
export declare function createModuleData<TModule extends object>(namespace: string, moduleDefaults: TModule): {
    NAMESPACE: string;
    MODULE_DEFAULTS: TModule;
    table: string;
    data(): TModule;
    get<K extends keyof TModule>(key: K): TModule[K];
};
/** Wires namespace + defaults for simple (non-panel) modules. */
export declare function defineSimpleModule<TConfig extends object, TTexts extends object>(opts: {
    namespace: string;
    configDefaults: TConfig;
    textDefaults: TTexts;
}): {
    CONFIG_DEFAULTS: TConfig;
    TEXT_DEFAULTS: TTexts;
    MODULE_DEFAULTS: TConfig & TTexts;
    NAMESPACE: string;
    get: <K extends keyof TConfig | keyof TTexts>(key: K) => (TConfig & TTexts)[K];
    data: () => TConfig & TTexts;
    table: string;
};
/** Non-empty trimmed string from a config/text value, or undefined when unset. */
export declare function optionalConfigString(value: unknown): string | undefined;
/** Resolves a list row by id with default texts and module-specific normalization. */
export declare function createListResolver<TConfig extends {
    id: string;
}, TTexts extends object, TResolved extends TConfig & TTexts, TModule extends object>(opts: {
    get: <K extends keyof TModule>(key: K) => TModule[K];
    listKey: keyof TModule;
    defaultTexts: TTexts;
    normalize: (row: TConfig & Partial<TTexts>) => TResolved;
}): (id: string) => TResolved | undefined;
/** Finds a merged list row by id (panel/ticket modules). */
export declare function findListItemById<T extends {
    id: string;
}>(list: T[] | undefined, id: string): T | undefined;
//# sourceMappingURL=moduleConfig.d.ts.map