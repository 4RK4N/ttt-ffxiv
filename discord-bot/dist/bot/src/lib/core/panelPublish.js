import { discordBotFetch } from "#shared/core/discordApi.js";
/**
 * Posts or edits a Discord channel message. Tries PATCH when existingMessageId
 * is set; falls back to POST on 404. Optional afterPublish runs after a
 * successful edit or create (e.g. sync emoji reactions).
 */
export async function publishDiscordMessage(ctx, channelId, payload, existingMessageId, afterPublish) {
    if (existingMessageId) {
        const editRes = await discordBotFetch(ctx.botToken, `/channels/${channelId}/messages/${existingMessageId}`, { method: "PATCH", body: JSON.stringify(payload) });
        if (editRes.ok) {
            if (afterPublish)
                await afterPublish(existingMessageId);
            return existingMessageId;
        }
        if (editRes.status !== 404) {
            throw new Error(`Failed to edit panel message (HTTP ${editRes.status}).`);
        }
    }
    const createRes = await discordBotFetch(ctx.botToken, `/channels/${channelId}/messages`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
    if (!createRes.ok) {
        throw new Error(`Failed to post panel message (HTTP ${createRes.status}).`);
    }
    const body = (await createRes.json());
    if (!body.id)
        throw new Error("Discord did not return a message id.");
    if (afterPublish)
        await afterPublish(body.id);
    return body.id;
}
//# sourceMappingURL=panelPublish.js.map