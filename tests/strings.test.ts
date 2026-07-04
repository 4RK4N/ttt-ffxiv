import { describe, expect, it } from 'vitest';
import { slugify, toStringArray } from '../src/core/strings.js';

describe('toStringArray', () => {
  it('returns string elements only', () => {
    expect(toStringArray(['a', 1, 'b'])).toEqual(['a', 'b']);
  });

  it('returns empty array for non-arrays', () => {
    expect(toStringArray(null)).toEqual([]);
  });
});

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('Hello World!')).toBe('hello-world');
  });

  it('truncates to 32 characters', () => {
    expect(slugify('a'.repeat(40))).toHaveLength(32);
  });

  it('falls back to item for empty input', () => {
    expect(slugify('---')).toBe('item');
  });
});
