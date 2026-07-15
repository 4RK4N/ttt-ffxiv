import { type MessageCreateOptions, type User } from "discord.js";
export interface TrySendDmOptions {
    logPrefix: string;
    onDmClosed?: () => void | Promise<void>;
    /** When not "throw", non-DM-closed errors are logged and return false. */
    onOtherError?: "log" | "throw";
}
/**
 * Sends a DM; handles closed-DM gracefully. Returns true when sent.
 */
export declare function trySendDm(user: User, payload: string | MessageCreateOptions, options: TrySendDmOptions): Promise<boolean>;
//# sourceMappingURL=discordDm.d.ts.map