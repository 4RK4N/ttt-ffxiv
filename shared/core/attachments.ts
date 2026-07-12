/** True when a Discord attachment content type is an image. */
export function isImageAttachment(
  contentType: string | null | undefined,
): boolean {
  return contentType?.startsWith("image/") ?? false;
}
