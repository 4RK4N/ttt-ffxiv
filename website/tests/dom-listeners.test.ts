import { describe, expect, it, vi } from 'vitest';
import { on, renewListenerScope } from '../src/lib/dom-listeners';

describe('renewListenerScope', () => {
  it('returns a fresh AbortController when current is null', () => {
    const next = renewListenerScope(null);
    expect(next).toBeInstanceOf(AbortController);
    expect(next.signal.aborted).toBe(false);
  });

  it('aborts the previous controller and returns a new one', () => {
    const previous = new AbortController();
    const next = renewListenerScope(previous);
    expect(previous.signal.aborted).toBe(true);
    expect(next).not.toBe(previous);
    expect(next.signal.aborted).toBe(false);
  });
});

describe('on', () => {
  it('registers a listener that is removed when the signal aborts', () => {
    const target = new EventTarget();
    const handler = vi.fn();
    const controller = new AbortController();

    on(target, 'ping', handler, controller.signal);
    target.dispatchEvent(new Event('ping'));
    expect(handler).toHaveBeenCalledTimes(1);

    controller.abort();
    target.dispatchEvent(new Event('ping'));
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
