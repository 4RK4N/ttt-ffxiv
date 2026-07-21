import { getModuleDataSync } from "./texts.js";
import { moduleTableName } from "./moduleTable.js";

/** Merges config + text defaults for DB seeding and store fallbacks. */
export function moduleDefaultsFromParts<
  TConfig extends object,
  TTexts extends object,
>(configDefaults: TConfig, textDefaults: TTexts): TConfig & TTexts {
  return { ...configDefaults, ...textDefaults };
}

export function createModuleData<TModule extends object>(
  namespace: string,
  moduleDefaults: TModule,
) {
  return {
    NAMESPACE: namespace,
    MODULE_DEFAULTS: moduleDefaults,
    table: moduleTableName(namespace),
    data(): TModule {
      return getModuleDataSync(namespace, moduleDefaults) as TModule;
    },
    get<K extends keyof TModule>(key: K): TModule[K] {
      const all = getModuleDataSync(namespace, moduleDefaults) as TModule;
      return all[key];
    },
  };
}

/** Wires namespace + defaults for simple (non-panel) modules. */
export function defineSimpleModule<
  TConfig extends object,
  TTexts extends object,
>(opts: { namespace: string; configDefaults: TConfig; textDefaults: TTexts }) {
  type TModule = TConfig & TTexts;
  const MODULE_DEFAULTS = moduleDefaultsFromParts(
    opts.configDefaults,
    opts.textDefaults,
  );
  const mod = createModuleData<TModule>(opts.namespace, MODULE_DEFAULTS);
  return {
    CONFIG_DEFAULTS: opts.configDefaults,
    TEXT_DEFAULTS: opts.textDefaults,
    MODULE_DEFAULTS,
    NAMESPACE: mod.NAMESPACE,
    get: mod.get,
    data: mod.data,
    table: mod.table,
  };
}

/** Non-empty trimmed string from a config/text value, or undefined when unset. */
export function optionalConfigString(value: unknown): string | undefined {
  const id = typeof value === "string" ? value.trim() : "";
  return id === "" ? undefined : id;
}

/** Resolves a list row by id with default texts and module-specific normalization. */
export function createListResolver<
  TConfig extends { id: string },
  TTexts extends object,
  TResolved extends TConfig & TTexts,
  TModule extends object,
>(opts: {
  get: <K extends keyof TModule>(key: K) => TModule[K];
  listKey: keyof TModule;
  defaultTexts: TTexts;
  normalize: (row: TConfig & Partial<TTexts>) => TResolved;
}): (id: string) => TResolved | undefined {
  return (id: string) => {
    const row = findListItemById(
      opts.get(opts.listKey) as Array<TConfig & Partial<TTexts>>,
      id,
    );
    if (!row) return undefined;
    return opts.normalize(row);
  };
}

/** Finds a merged list row by id (panel/ticket modules). */
export function findListItemById<T extends { id: string }>(
  list: T[] | undefined,
  id: string,
): T | undefined {
  if (!Array.isArray(list)) return undefined;
  return list.find((item) => item.id === id);
}
