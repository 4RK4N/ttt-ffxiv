import {
  getModuleDataSync,
  invalidateModuleCache,
  warmModuleCache,
} from "./texts.js";
import { moduleTableName } from "./moduleTable.js";
import { getDbData, setDbData } from "./dbData.js";

/** Merges config + text defaults for DB seeding and cache fallbacks. */
export function moduleDefaultsFromParts<
  TConfig extends object,
  TTexts extends object,
>(
  configDefaults: TConfig,
  textDefaults: TTexts,
  omitTextKeys: (keyof TTexts)[] = [],
): TConfig & TTexts {
  const texts = { ...textDefaults } as Record<string, unknown>;
  for (const key of omitTextKeys) {
    delete texts[key as string];
  }
  return { ...configDefaults, ...texts } as TConfig & TTexts;
}

export function createModuleData<TModule extends object>(
  namespace: string,
  moduleDefaults: TModule,
) {
  return {
    NAMESPACE: namespace,
    MODULE_DEFAULTS: moduleDefaults,
    table: moduleTableName(namespace),
    async refresh(): Promise<void> {
      await warmModuleCache(namespace);
    },
    data(): TModule {
      return getModuleDataSync(namespace, moduleDefaults) as TModule;
    },
    get<K extends keyof TModule>(key: K): TModule[K] {
      const all = getModuleDataSync(namespace, moduleDefaults) as TModule;
      return all[key];
    },
    async getDb(key: keyof TModule & string): Promise<TModule[keyof TModule]> {
      const value = await getDbData(moduleTableName(namespace), key);
      if (value === undefined) {
        return moduleDefaults[key];
      }
      return value as TModule[keyof TModule];
    },
    async setDb(key: keyof TModule & string, value: unknown): Promise<void> {
      await setDbData(moduleTableName(namespace), key, value);
      invalidateModuleCache(namespace);
      await warmModuleCache(namespace);
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
