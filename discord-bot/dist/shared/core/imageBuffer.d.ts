export type SupportedImageType = "png" | "jpeg" | "gif" | "webp";
/** Detects PNG, JPEG, GIF, or WebP from magic bytes. */
export declare function detectImageType(buffer: Buffer): SupportedImageType | null;
export declare function isSupportedEmojiImageBuffer(buffer: Buffer): {
    ok: true;
    animated: boolean;
} | {
    ok: false;
};
//# sourceMappingURL=imageBuffer.d.ts.map