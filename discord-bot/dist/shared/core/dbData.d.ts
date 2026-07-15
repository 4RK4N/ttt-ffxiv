import type { Database } from "@tursodatabase/database";
/** Reserved module row keys — not merged into bot runtime data. */
export declare const RESERVED_MODULE_KEYS: Set<string>;
export declare function getDbData(table: string, key: string): Promise<unknown>;
/** Reads a single key on an open transaction connection. */
export declare function getDbDataFromClient(client: Database, table: string, key: string): Promise<unknown>;
export declare function getDbDataAll(table: string, defaults?: object): Promise<Record<string, unknown>>;
export declare function setDbData(table: string, key: string, value: unknown, client?: Database): Promise<void>;
export declare function setDbDataMany(table: string, rows: Record<string, unknown>, client?: Database): Promise<void>;
//# sourceMappingURL=dbData.d.ts.map