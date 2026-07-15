import { type ChatInputCommandInteraction } from "discord.js";
import type { EmojisTexts } from "../../lib/modules/emojis/config-io.js";
type CreateErrorKey = keyof Pick<EmojisTexts, "nameTaken" | "fileTooLarge" | "botMissingPermission" | "slotsFull" | "createFailed">;
export declare function mapCreateError(err: unknown): CreateErrorKey;
export declare function validateName(interaction: ChatInputCommandInteraction, t: EmojisTexts, name: string): Promise<boolean>;
export declare function executeEmojiAdd(interaction: ChatInputCommandInteraction): Promise<void>;
export declare function executeEmojiCopy(interaction: ChatInputCommandInteraction): Promise<void>;
export {};
//# sourceMappingURL=handlers.d.ts.map