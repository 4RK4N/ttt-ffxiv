import { withTransaction } from "#shared/core/db.js";
import { getDbDataFromClient, setDbData, } from "#shared/core/dbData.js";
import { moduleTableName } from "#shared/core/moduleTable.js";
import { getModuleRowsSync, reloadModuleStore, } from "#shared/core/texts.js";
export function createConfigIo(namespace, listKey) {
    const table = moduleTableName(namespace);
    function readList() {
        const raw = getModuleRowsSync(namespace)[listKey];
        return Array.isArray(raw) ? raw : [];
    }
    async function updateItem(id, patch) {
        let updated;
        await withTransaction(async (client) => {
            const current = await getDbDataFromClient(client, table, listKey);
            const list = Array.isArray(current) ? current : [];
            const index = list.findIndex((item) => item.id === id);
            if (index === -1)
                return;
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
    function getItemConfig(id) {
        return readList().find((item) => item.id === id);
    }
    return { updateItem, getItemConfig };
}
//# sourceMappingURL=configIo.js.map