/** Detects PNG, JPEG, GIF, or WebP from magic bytes. */
export function detectImageType(buffer) {
    if (buffer.length < 12)
        return null;
    if (buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47) {
        return "png";
    }
    if (buffer[0] === 0x47 &&
        buffer[1] === 0x49 &&
        buffer[2] === 0x46 &&
        buffer[3] === 0x38) {
        return "gif";
    }
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
        return "jpeg";
    }
    if (buffer[0] === 0x52 &&
        buffer[1] === 0x49 &&
        buffer[2] === 0x46 &&
        buffer[3] === 0x46 &&
        buffer[8] === 0x57 &&
        buffer[9] === 0x45 &&
        buffer[10] === 0x42 &&
        buffer[11] === 0x50) {
        return "webp";
    }
    return null;
}
export function isSupportedEmojiImageBuffer(buffer) {
    const type = detectImageType(buffer);
    if (!type)
        return { ok: false };
    return { ok: true, animated: type === "gif" };
}
//# sourceMappingURL=imageBuffer.js.map