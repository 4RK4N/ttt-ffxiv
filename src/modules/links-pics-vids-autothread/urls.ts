const URL_REGEX = /https?:\/\/[^\s<>]+/gi;

function normalizeHost(host: string): string {
  return host.replace(/^www\./i, '').toLowerCase();
}

export function isSupportedPostUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }

  const host = normalizeHost(url.hostname);
  const path = url.pathname.replace(/[).,]+$/, '');

  if (['x.com', 'twitter.com', 'mobile.twitter.com'].includes(host)) {
    return /\/status(?:es)?\/\d+/.test(path);
  }

  if (host === 'bsky.app') {
    return /^\/profile\/[^/]+\/post\/[^/]+/.test(path);
  }

  if (host === 'aethy.com') {
    return /^\/@[^/]+\/\d+/.test(path) || /^\/users\/[^/]+\/statuses\/\d+/.test(path);
  }

  return false;
}

export function extractSupportedPostUrls(text: string): string[] {
  const matches = text.match(URL_REGEX) ?? [];
  return matches.filter(isSupportedPostUrl);
}
