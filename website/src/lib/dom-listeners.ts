export function renewListenerScope(current: AbortController | null): AbortController {
  current?.abort();
  return new AbortController();
}

export function on(
  target: EventTarget,
  type: string,
  handler: EventListenerOrEventListenerObject,
  signal: AbortSignal
): void {
  target.addEventListener(type, handler, { signal });
}
