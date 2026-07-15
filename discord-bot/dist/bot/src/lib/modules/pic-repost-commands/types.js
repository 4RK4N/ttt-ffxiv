import { defineSimpleModule } from "#shared/core/moduleConfig.js";
import { DEFAULT_THREAD_FIRST_MESSAGE } from "../../core/threads.js";
export const DEFAULT_DELETE_EMOJI = "🗑️";
export const CONFIG_DEFAULTS = {
    enabled: true,
    deleteEmoji: DEFAULT_DELETE_EMOJI,
    deleteAuthorLastMention: true,
};
export function resolveDeleteEmoji(cfg) {
    const trimmed = cfg.deleteEmoji?.trim();
    return trimmed || DEFAULT_DELETE_EMOJI;
}
export function resolveDeleteAuthorLastMention(cfg) {
    return cfg.deleteAuthorLastMention !== false;
}
export const TEXT_DEFAULTS = {
    disabled: "This command is currently disabled.",
    noImages: "You need to attach at least one image.",
    notImages: "These attachments are not images: {names}. Please attach image files only.",
    messageTooLong: "Your message is too long. Please keep it under 2000 characters.",
    attachmentTooLarge: "One or more images are too large: {names}. This server allows up to {limit} per file.",
    downloadFailed: "Could not download one of your images. Please try again with a smaller or different file.",
    cannotPost: "I cannot post in this channel.",
    postFailed: "I could not post in this channel. This is usually a file size limit or missing " +
        '"Send Messages"/"Attach Files" permission.',
    attribution: "{message}\n\nby {mention}\n\nReact with {deleteEmoji} to delete",
    postedSuccess: "Posted {count} {images} to this channel.",
    threadNote: "\n\nNote: I could not create the comments thread. I may be missing the " +
        '"Create Public Threads" / "Send Messages in Threads" permission in this channel.',
    threadFirstMessage: DEFAULT_THREAD_FIRST_MESSAGE,
};
const mod = defineSimpleModule({
    namespace: "pic-repost-commands",
    configDefaults: CONFIG_DEFAULTS,
    textDefaults: TEXT_DEFAULTS,
});
export const MODULE_DEFAULTS = mod.MODULE_DEFAULTS;
export const NAMESPACE = mod.NAMESPACE;
export const get = mod.get;
export const data = mod.data;
//# sourceMappingURL=types.js.map