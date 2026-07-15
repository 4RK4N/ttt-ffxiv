import { type Database } from "@tursodatabase/database";
export interface DbBootstrapConfig {
    dbPath: string;
}
export interface InitDbOptions {
    /** Open without a write lock — safe while the bot holds the DB (deploy, dump). */
    readonly?: boolean;
    fileMustExist?: boolean;
}
export declare function loadDbBootstrapConfig(): DbBootstrapConfig;
export declare function initDb(bootstrap?: DbBootstrapConfig, options?: InitDbOptions): Promise<Database>;
export declare function getDb(): Database;
export declare function closeDb(): Promise<void>;
export declare function withTransaction<T>(fn: (client: Database) => Promise<T>): Promise<T>;
//# sourceMappingURL=db.d.ts.map