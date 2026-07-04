import { describe, expect, it } from 'vitest';
import { isFieldVisible, liveRowValues } from '../src/web/editor-logic.js';

describe('liveRowValues', () => {
  it('preserves existing id', () => {
    const out = liveRowValues([], { id: 'abc' }, undefined);
    expect(out.id).toBe('abc');
  });

  it('slugifies from openButtonLabel when id missing', () => {
    const out = liveRowValues(
      [{ key: 'openButtonLabel', getValue: () => 'My Panel!' }],
      {},
      { itemLabel: 'item' },
    );
    expect(out.id).toBe('my-panel');
  });

  it('collects sub-field values', () => {
    const out = liveRowValues(
      [
        { key: 'channelId', getValue: () => '123' },
        { key: 'panelTitle', getValue: () => 'Title' },
      ],
      { id: 'x', published: true },
      undefined,
    );
    expect(out).toEqual({ id: 'x', channelId: '123', panelTitle: 'Title' });
  });
});

describe('isFieldVisible', () => {
  const subFields = [
    { key: 'mode', getValue: () => 'embed' },
    { key: 'title', getValue: () => 'Hello' },
  ];

  it('returns true when no visibleWhen', () => {
    expect(isFieldVisible({}, subFields)).toBe(true);
  });

  it('returns false when watched value not allowed', () => {
    expect(
      isFieldVisible({ visibleWhen: { mode: ['button'] } }, subFields),
    ).toBe(false);
  });

  it('returns true when watched value matches', () => {
    expect(
      isFieldVisible({ visibleWhen: { mode: ['embed', 'button'] } }, subFields),
    ).toBe(true);
  });
});
