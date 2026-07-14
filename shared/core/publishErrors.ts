/** Client-safe message for publish/unpublish failures (no internal detail). */
export function publishClientError(isPublish: boolean): string {
  return isPublish ? "Publish failed." : "Unpublish failed.";
}
