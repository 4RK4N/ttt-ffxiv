let handlersByNamespace = {};
/** Called once at combined-app startup from the bot publish registry. */
export function registerPublishHandlers(map) {
    handlersByNamespace = map;
}
export function getPublishHandlers(namespace) {
    return handlersByNamespace[namespace];
}
//# sourceMappingURL=panelPublishBridge.js.map