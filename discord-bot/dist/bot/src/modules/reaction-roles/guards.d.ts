import type { GuildMember, MessageComponentInteraction } from "discord.js";
import { data } from "../../lib/modules/reaction-roles/config-io.js";
import type { ReactionType, ResolvedRolePanel } from "#shared/modules/reaction-roles/types.js";
export type PanelGuardResult = {
    ok: true;
    panel: ResolvedRolePanel;
    t: ReturnType<typeof data>;
} | {
    ok: false;
};
/** Shared preamble for button/select interactions on a published role panel. */
export declare function guardPublishedPanel(interaction: MessageComponentInteraction, panelId: string, options: {
    reactionType: ReactionType | ReactionType[];
    requireGuild?: boolean;
}): Promise<PanelGuardResult>;
/** True when the interaction is on the panel's current published message. */
export declare function isActivePanelMessage(panel: ResolvedRolePanel, channelId: string | null, messageId: string | undefined): boolean;
/** Fetches the interacting guild member; replies with roleError when missing. */
export declare function fetchPanelGuildMember(interaction: MessageComponentInteraction, roleError: string): Promise<GuildMember | null>;
/** Enforces per-user panel cooldown; replies with cooldown text when active. */
export declare function guardPanelCooldown(interaction: MessageComponentInteraction, panelId: string, cooldownText: string): Promise<boolean>;
//# sourceMappingURL=guards.d.ts.map