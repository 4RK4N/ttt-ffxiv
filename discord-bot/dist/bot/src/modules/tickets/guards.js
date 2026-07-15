import { replyEphemeral } from "../../lib/core/discordInteractions.js";
import { isModuleEnabled } from "#shared/core/texts.js";
import { isClosedTicketThread } from "./names.js";
import { NAMESPACE, resolveTicketType, data, } from "../../lib/modules/tickets/config-io.js";
/** Shared preamble for ticket thread button actions (close/delete/role-action). */
export async function guardTicketThreadAction(interaction, typeId, expectedThreadId, options) {
    const t = data();
    if (!isModuleEnabled(NAMESPACE)) {
        await replyEphemeral(interaction, t.disabled);
        return { ok: false };
    }
    const ticketType = resolveTicketType(typeId);
    if (!ticketType) {
        await replyEphemeral(interaction, t.categoryUnpublished);
        return { ok: false };
    }
    const channel = interaction.channel;
    if (!channel?.isThread()) {
        await replyEphemeral(interaction, t.threadContextRequired);
        return { ok: false };
    }
    if (expectedThreadId !== channel.id) {
        await replyEphemeral(interaction, t.invalidInteraction);
        return { ok: false };
    }
    if (options?.requireOpen &&
        isClosedTicketThread(channel.name, channel.locked === true)) {
        await replyEphemeral(interaction, t.invalidInteraction);
        return { ok: false };
    }
    return { ok: true, ctx: { ticketType, thread: channel, t } };
}
//# sourceMappingURL=guards.js.map