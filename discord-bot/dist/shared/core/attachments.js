/** True when a Discord attachment content type is an image. */
export function isImageAttachment(contentType) {
    return contentType?.startsWith("image/") ?? false;
}
//# sourceMappingURL=attachments.js.map