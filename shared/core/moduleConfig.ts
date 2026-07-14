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

/** Finds a merged list row by id (panel/ticket modules). */
export function findListItemById<T extends { id: string }>(
  list: T[] | undefined,
  id: string,
): T | undefined {
  if (!Array.isArray(list)) return undefined;
  return list.find((item) => item.id === id);
}
