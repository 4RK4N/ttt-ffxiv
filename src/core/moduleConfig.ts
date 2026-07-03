import { getConfig, getTexts } from './texts.js';

export function createModuleConfig<TConfig extends object, TTexts extends object>(
  namespace: string,
  configDefaults: TConfig,
  textDefaults: TTexts
) {
  return {
    NAMESPACE: namespace,
    CONFIG_DEFAULTS: configDefaults,
    TEXT_DEFAULTS: textDefaults,
    config: () => getConfig(namespace, configDefaults),
    texts: () => getTexts(namespace, textDefaults),
  };
}

/** Merges a config list row with its keyed texts entry and optional post-merge hook. */
export function resolveKeyedItem<
  TConfig extends { id: string },
  TTexts extends object,
  TResolved extends TConfig & TTexts = TConfig & TTexts,
>(
  list: TConfig[],
  id: string,
  textsMap: Record<string, TTexts>,
  defaultTexts: TTexts,
  merge?: (row: TConfig, texts: TTexts) => TResolved
): TResolved | undefined {
  const row = list.find((item) => item.id === id);
  if (!row) return undefined;
  const copy = textsMap[id] ?? defaultTexts;
  if (merge) return merge(row, copy);
  return { ...row, ...copy } as TResolved;
}
