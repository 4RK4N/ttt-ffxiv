import { describe, expect, it } from "vitest";
import { buildCspHeader, generateCspNonce } from "../web-admin/src/csp.js";

describe("CSP helpers", () => {
  it("generates unique nonces", () => {
    const a = generateCspNonce();
    const b = generateCspNonce();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThan(0);
  });

  it("builds strict script-src and style-src policies", () => {
    const header = buildCspHeader("test-nonce");
    expect(header).toContain("script-src 'self' 'nonce-test-nonce'");
    expect(header).toContain("style-src 'self'");
    expect(header).not.toMatch(/script-src[^;]*unsafe-inline/);
    expect(header).not.toMatch(/style-src[^;]*unsafe-inline/);
    expect(header).toContain("frame-ancestors 'none'");
  });
});
