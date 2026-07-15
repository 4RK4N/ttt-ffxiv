export function createPanelPublisher(opts) {
    async function publish(ctx, id) {
        const item = opts.resolve(id);
        if (!item)
            throw new Error(`Unknown ${opts.entityLabel} "${id}".`);
        if (!item.channelId.trim()) {
            throw new Error(`Channel is not configured for this ${opts.entityLabel}.`);
        }
        const messageId = await opts.publishPanel(ctx, id, item.channelId, item.panelMessageId || undefined);
        await opts.update(id, {
            published: true,
            panelMessageId: messageId,
        });
    }
    async function unpublish(id) {
        if (!opts.getConfig(id))
            throw new Error(`Unknown ${opts.entityLabel} "${id}".`);
        await opts.update(id, { published: false });
    }
    return { publish, unpublish };
}
//# sourceMappingURL=panelPublisher.js.map