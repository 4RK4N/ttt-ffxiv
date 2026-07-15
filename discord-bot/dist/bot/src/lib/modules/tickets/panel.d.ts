import { ActionRowBuilder, ButtonBuilder } from "discord.js";
import { type DiscordApiContext } from "../../core/panelPublish.js";
export type { DiscordApiContext };
export declare const CLOSE_CANCEL_PREFIX = "tickets:close-cancel:";
export declare const DELETE_CANCEL_PREFIX = "tickets:delete-cancel:";
export declare const OPEN_PREFIX = "tickets:open:";
export declare const CLOSE_PREFIX = "tickets:close:";
export declare const CLOSE_CONFIRM_PREFIX = "tickets:close-confirm:";
export declare const DELETE_PREFIX = "tickets:delete:";
export declare const DELETE_CONFIRM_PREFIX = "tickets:delete-confirm:";
export declare const ROLE_ACTION_PREFIX = "tickets:role-action:";
export declare function buildConfirmRow(yesCustomId: string, noCustomId: string, yesLabel: string, noLabel: string): ActionRowBuilder<ButtonBuilder>;
export declare function buildPanelPayload(typeId: string): {
    embeds: import("discord.js").APIEmbed[];
    components: import("discord.js").APIActionRowComponent<import("discord.js").APIButtonComponent>[];
};
export declare function publishPanel(ctx: DiscordApiContext, typeId: string, channelId: string, existingMessageId?: string): Promise<string>;
//# sourceMappingURL=panel.d.ts.map