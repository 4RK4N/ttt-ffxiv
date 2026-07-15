import { defineSimpleModule } from "#shared/core/moduleConfig.js";
import { DEFAULT_THREAD_FIRST_MESSAGE } from "../../core/threads.js";
const DEFAULT_NON_QUALIFYING_DM = "Hi! Your message in {channel} was removed because this channel is for images, videos, and supported post links only. Please comment in the thread under an existing post instead of posting in the channel.\n\n" +
    "Hallo! Deine Nachricht in {channel} wurde entfernt, weil dieser Channel nur für Bilder, Videos und unterstützte Post-Links gedacht ist. Bitte kommentiere im Thread unter einem bestehenden Post, statt im Channel zu schreiben.";
export const CONFIG_DEFAULTS = {
    channelIds: [],
    deleteNonQualifyingMessages: false,
};
export const TEXT_DEFAULTS = {
    threadFirstMessage: DEFAULT_THREAD_FIRST_MESSAGE,
    nonQualifyingDm: DEFAULT_NON_QUALIFYING_DM,
};
const mod = defineSimpleModule({
    namespace: "links-pics-vids-autothread",
    configDefaults: CONFIG_DEFAULTS,
    textDefaults: TEXT_DEFAULTS,
});
export const MODULE_DEFAULTS = mod.MODULE_DEFAULTS;
export const NAMESPACE = mod.NAMESPACE;
export const get = mod.get;
export const data = mod.data;
export function channelIds() {
    return get("channelIds");
}
export function deleteNonQualifyingMessagesEnabled(moduleData = data()) {
    return moduleData.deleteNonQualifyingMessages === true;
}
//# sourceMappingURL=types.js.map