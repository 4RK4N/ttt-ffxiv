export interface ConfigIo<T extends {
    id: string;
}> {
    updateItem: (id: string, patch: Partial<T>) => Promise<T | undefined>;
    getItemConfig: (id: string) => T | undefined;
}
export declare function createConfigIo<T extends {
    id: string;
}>(namespace: string, listKey: string): ConfigIo<T>;
//# sourceMappingURL=configIo.d.ts.map