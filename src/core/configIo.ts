import { readFileSync } from 'node:fs';
import { invalidateModuleCache, moduleDataPath } from './texts.js';
import { writeJsonAtomic } from './jsonWrite.js';

export interface ConfigIo<T extends { id: string }> {
  updateItem: (id: string, patch: Partial<T>) => Promise<T | undefined>;
  getItemConfig: (id: string) => T | undefined;
}

export function createConfigIo<T extends { id: string }>(
  namespace: string,
  listKey: string,
  defaults: object
): ConfigIo<T> {
  function readRawConfig(): Record<string, unknown> {
    const file = moduleDataPath(namespace, 'config.json');
    try {
      return { ...defaults, ...JSON.parse(readFileSync(file, 'utf8')) };
    } catch {
      return { ...(defaults as Record<string, unknown>) };
    }
  }

  function readList(): T[] {
    const raw = readRawConfig()[listKey];
    return Array.isArray(raw) ? (raw as T[]) : [];
  }

  async function updateItem(id: string, patch: Partial<T>): Promise<T | undefined> {
    const current = readRawConfig();
    const list = readList();
    const index = list.findIndex((item) => item.id === id);
    if (index === -1) return undefined;

    const updated = { ...list[index], ...patch };
    const nextList = list.slice();
    nextList[index] = updated;

    await writeJsonAtomic(moduleDataPath(namespace, 'config.json'), {
      ...current,
      [listKey]: nextList,
    });
    invalidateModuleCache(namespace);

    return updated;
  }

  function getItemConfig(id: string): T | undefined {
    return readList().find((item) => item.id === id);
  }

  return { updateItem, getItemConfig };
}
