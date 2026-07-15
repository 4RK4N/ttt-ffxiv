import { EmbedBuilder } from "discord.js";
import { type DiscordApiContext } from "../../core/panelPublish.js";
export type { DiscordApiContext };
export declare function buildPanelPayload(panelId: string): {
    panel: import("#shared/modules/custom-embeds/types.js").ResolvedEmbedPanel;
    payload: {
        embeds: ReturnType<EmbedBuilder["toJSON"]>[];
    };
};
export declare function publishPanel(ctx: DiscordApiContext, panelId: string, channelId: string, existingMessageId?: string): Promise<string>;
//# sourceMappingURL=panel.d.ts.map