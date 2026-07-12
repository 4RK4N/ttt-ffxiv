import { randomBytes } from "node:crypto";

/** Generates a CSP-safe nonce for script tags. */
export function generateCspNonce(): string {
  return randomBytes(16).toString("base64");
}

/** Builds the web-admin Content-Security-Policy header value. */
export function buildCspHeader(nonce: string): string {
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    "style-src 'self'",
    "img-src 'self' data: https://cdn.discordapp.com",
    "connect-src 'self' https://discord.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ];
  return directives.join("; ");
}
