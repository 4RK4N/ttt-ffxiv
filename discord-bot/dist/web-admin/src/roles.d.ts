import type { WebConfig } from "./config.js";
export interface GuildRole {
    id: string;
    name: string;
    color: number;
}
export declare function listGuildRoles(cfg: WebConfig): Promise<GuildRole[]>;
//# sourceMappingURL=roles.d.ts.map