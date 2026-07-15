export interface ParsedCloseCustomId {
    threadId: string;
    typeId: string;
    openerUserId?: string;
}
export interface ParsedDeleteCustomId {
    threadId: string;
    typeId: string;
}
export interface ParsedRoleActionCustomId {
    threadId: string;
    typeId: string;
    openerUserId?: string;
}
export declare function parseCloseCustomId(customId: string): ParsedCloseCustomId | null;
export declare function parseDeleteCustomId(customId: string): ParsedDeleteCustomId | null;
export declare function parseRoleActionCustomId(customId: string): ParsedRoleActionCustomId | null;
//# sourceMappingURL=parsers.d.ts.map