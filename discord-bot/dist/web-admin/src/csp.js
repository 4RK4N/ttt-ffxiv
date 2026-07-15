import { randomBytes } from "node:crypto";
/** Generates a CSP-safe nonce for script tags. */
export function generateCspNonce() {
    return randomBytes(16).toString("base64");
}
/** Builds the web-admin Content-Security-Policy header value. */
export function buildCspHeader(nonce) {
    const directives = [
        "default-src 'self'",
        `script-src 'self' 'nonce-${nonce}'`,
        // HTMX injects a <style> tag for indicators by default; we host equivalent rules in admin.css.
        "style-src 'self'",
        "img-src 'self' data: https://cdn.discordapp.com",
        "connect-src 'self' https://discord.com",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        // Chrome applies form-action to redirect chains after POST; allow Discord OAuth.
        "form-action 'self' https://discord.com",
    ];
    return directives.join("; ");
}
//# sourceMappingURL=csp.js.map