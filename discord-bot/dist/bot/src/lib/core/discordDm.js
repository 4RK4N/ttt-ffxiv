import { DiscordAPIError, } from "discord.js";
import { DISCORD_CANNOT_SEND_DM } from "#shared/core/limits.js";
/**
 * Sends a DM; handles closed-DM gracefully. Returns true when sent.
 */
export async function trySendDm(user, payload, options) {
    try {
        await user.send(payload);
        return true;
    }
    catch (err) {
        if (err instanceof DiscordAPIError && err.code === DISCORD_CANNOT_SEND_DM) {
            console.warn(`${options.logPrefix} Could not DM user ${user.id} (DMs closed).`);
            if (options.onDmClosed)
                await options.onDmClosed();
            return false;
        }
        if (options.onOtherError === "throw")
            throw err;
        console.error(`${options.logPrefix} Failed to send DM to user ${user.id}:`, err);
        return false;
    }
}
//# sourceMappingURL=discordDm.js.map