import { describe, expect, it } from 'vitest';
import { headerLogoDisplayPx, remPx } from '../website/src/data/layout.js';

describe('layout helpers', () => {
  it('remPx scales by root font size', () => {
    expect(remPx(2, 24)).toBe(48);
  });

  it('headerLogoDisplayPx preserves aspect ratio', () => {
    const width = headerLogoDisplayPx(24);
    expect(width).toBeGreaterThan(0);
  });
});
