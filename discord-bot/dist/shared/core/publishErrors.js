/** Client-safe message for publish/unpublish failures (no internal detail). */
export function publishClientError(isPublish) {
    return isPublish ? "Publish failed." : "Unpublish failed.";
}
//# sourceMappingURL=publishErrors.js.map