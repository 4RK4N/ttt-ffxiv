import { type ButtonInteraction } from "discord.js";
import { type RoleChangeResult } from "../../lib/core/discordRoles.js";
import type { ReactionRolesTexts, ResolvedRolePanel } from "#shared/modules/reaction-roles/types.js";
export interface EphemeralContext {
    mention: string;
    role: string;
}
export declare function formatEphemeralMessage(panel: ResolvedRolePanel, context: EphemeralContext): string | undefined;
/** Replies with a role-error ephemeral when assign/remove failed; returns true on success. */
export declare function replyRoleResult(interaction: ButtonInteraction, result: RoleChangeResult, t: Pick<ReactionRolesTexts, "roleError" | "roleHierarchyError">): Promise<boolean>;
//# sourceMappingURL=respond.d.ts.map