import { describe, expect, it } from 'vitest';
import { isSupportedPostUrl } from '../bot/src/modules/links-pics-vids-autothread/urls.js';

describe('isSupportedPostUrl', () => {
  it('accepts x.com status links', () => {
    expect(isSupportedPostUrl('https://x.com/user/status/1234567890')).toBe(true);
  });

  it('accepts bsky.app post links', () => {
    expect(isSupportedPostUrl('https://bsky.app/profile/user.bsky.social/post/abc')).toBe(true);
  });

  it('rejects unrelated hosts', () => {
    expect(isSupportedPostUrl('https://example.com/foo')).toBe(false);
  });
});
