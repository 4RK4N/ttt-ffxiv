import { type GuildMember } from "discord.js";
export interface RoleChangeResult {
    ok: boolean;
    reason?: "managed" | "hierarchy" | "permission" | "missing";
}
export declare function tryAssignRole(member: GuildMember, roleId: string, logPrefix?: string): Promise<RoleChangeResult>;
export declare function tryRemoveRole(member: GuildMember, roleId: string, logPrefix?: string): Promise<RoleChangeResult>;
/** User-facing message for a failed role assign/remove. */
export declare function roleChangeErrorMessage(result: RoleChangeResult, hierarchyError: string, error: string): string;
//# sourceMappingURL=discordRoles.d.ts.map