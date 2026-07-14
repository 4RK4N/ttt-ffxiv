import { withTransaction } from "../../../../shared/core/db.js";
import {
  getDbDataFromClient,
  setDbData,
} from "../../../../shared/core/dbData.js";
import { moduleTableName } from "../../../../shared/core/moduleTable.js";
import {
  getModuleRowsSync,
  reloadModuleStore,
} from "../../../../shared/core/texts.js";

export interface ConfigIo<T extends { id: string }> {
  updateItem: (id: string, patch: Partial<T>) => Promise<T | undefined>;
  getItemConfig: (id: string) => T | undefined;
}

export function createConfigIo<T extends { id: string }>(
  namespace: string,
  listKey: string,
): ConfigIo<T> {
  const table = moduleTableName(namespace);

  function readList(): T[] {
    const raw = getModuleRowsSync(namespace)[listKey];
    return Array.isArray(raw) ? (raw as T[]) : [];
  }

  async function updateItem(
    id: string,
    patch: Partial<T>,
  ): Promise<T | undefined> {
    let updated: T | undefined;

    await withTransaction(async (client) => {
      const current = await getDbDataFromClient(client, table, listKey);
      const list = Array.isArray(current) ? (current as T[]) : [];
      const index = list.findIndex((item) => item.id === id);
      if (index === -1) return;

      updated = { ...list[index], ...patch };
      const nextList = list.slice();
      nextList[index] = updated;

      await setDbData(table, listKey, nextList, client);
    });

    if (updated) {
      await reloadModuleStore(namespace);
    }

    return updated;
  }

  function getItemConfig(id: string): T | undefined {
    return readList().find((item) => item.id === id);
  }

  return { updateItem, getItemConfig };
}
