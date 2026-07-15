import { EmbedBuilder } from "discord.js";
import { type DiscordApiContext } from "../../core/panelPublish.js";
import type { ResolvedRolePanel, RoleOption } from "#shared/modules/reaction-roles/types.js";
export type { DiscordApiContext };
export declare const BTN_PREFIX = "reaction-roles:btn:";
export declare const SEL_PREFIX = "reaction-roles:sel:";
export declare function buildPanelPayload(panelId: string): {
    panel: ResolvedRolePanel;
    payload: {
        embeds: ReturnType<EmbedBuilder["toJSON"]>[];
        components?: unknown[];
    };
};
export declare function publishPanel(ctx: DiscordApiContext, panelId: string, channelId: string, existingMessageId?: string): Promise<string>;
/** Match a reaction emoji to a panel option. */
export declare function matchOptionByReaction(options: RoleOption[], emojiName: string | null, emojiId: string | null): RoleOption | undefined;
//# sourceMappingURL=panel.d.ts.map