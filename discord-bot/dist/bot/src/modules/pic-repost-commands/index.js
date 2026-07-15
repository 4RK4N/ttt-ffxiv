import { SlashCommandBuilder, } from "discord.js";
import { NAMESPACE } from "../../lib/modules/pic-repost-commands/config-io.js";
import { registerDeleteReactionHandler } from "./handle-reaction.js";
import { executePicRepost } from "./handlers.js";
const MAX_IMAGES = 10;
function buildCommand(name) {
    const builder = new SlashCommandBuilder()
        .setName(name)
        .setDMPermission(false)
        .setDescription("Re-post your images to this channel with attribution (avoids false auto-mod bans).")
        .addStringOption((opt) => opt
        .setName("message")
        .setDescription("Text to include with your images.")
        .setRequired(true));
    for (let i = 1; i <= MAX_IMAGES; i++) {
        builder.addAttachmentOption((opt) => opt
            .setName(`image${i}`)
            .setDescription(i === 1
            ? "Image to post (required)."
            : `Additional image ${i} (optional).`)
            .setRequired(i === 1));
    }
    return builder;
}
const picRepostModule = {
    name: NAMESPACE,
    commands: [
        { data: buildCommand("pic"), execute: executePicRepost },
        { data: buildCommand("post"), execute: executePicRepost },
    ],
    init: registerDeleteReactionHandler,
};
export default picRepostModule;
//# sourceMappingURL=index.js.map