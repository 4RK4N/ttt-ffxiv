import type { Guild, GuildMember } from "discord.js";
import type { ReactionRolesTexts, ResolvedRolePanel } from "#shared/modules/reaction-roles/types.js";
export interface DropdownRoleSelectionResult {
    changedRoleNames: string[];
}
export declare function applyDropdownRoleSelection(opts: {
    member: GuildMember;
    panel: ResolvedRolePanel;
    selectedOptionIds: string[];
    guild: Guild | null;
    texts: ReactionRolesTexts;
}): Promise<DropdownRoleSelectionResult>;
//# sourceMappingURL=role-selection.d.ts.map