import type { Context, MiddlewareHandler } from "hono";
import type { WebConfig } from "./config.js";
export interface SessionUser {
    id: string;
    username: string;
}
/** Builds the Discord authorize URL and stores a one-time state in a cookie. */
export declare function startLogin(c: Context, cfg: WebConfig): Promise<Response>;
export interface CallbackResult {
    ok: boolean;
    status: number;
    user?: SessionUser;
    message?: string;
}
/**
 * Handles the OAuth2 redirect: verifies state, exchanges the code, checks guild
 * admin, and on success writes the session cookie. Returns a result the caller
 * turns into a redirect or an error page.
 */
export declare function handleCallback(c: Context, cfg: WebConfig): Promise<CallbackResult>;
export declare function logout(c: Context): void;
/** Reads and verifies the session cookie, returning the user or null. */
export declare function getSessionUser(c: Context, cfg: WebConfig): Promise<SessionUser | null>;
/**
 * Session user who still has guild admin. Clears cookies when session exists
 * but admin was revoked.
 */
export declare function getAuthorizedSessionUser(c: Context, cfg: WebConfig): Promise<SessionUser | null>;
/** CSRF token for double-submit validation (signed cookie, set on login). */
export declare function getCsrfToken(c: Context, cfg: WebConfig): Promise<string | null>;
/** Returns a CSRF token, minting a signed cookie when missing (e.g. pre-CSRF sessions). */
export declare function ensureCsrfToken(c: Context, cfg: WebConfig): Promise<string>;
/**
 * Middleware that requires a valid session. API requests get a 401 JSON; page
 * requests are redirected to /login. The authenticated user is stored on the
 * context under "user".
 */
export declare function requireAuth(cfg: WebConfig): MiddlewareHandler;
/** Validates a CSRF token from a form field against the signed CSRF cookie. */
export declare function verifyFormCsrf(c: Context, cfg: WebConfig, formToken: string): Promise<boolean>;
/** Validates X-CSRF-Token header against the signed CSRF cookie on mutating requests. */
export declare function requireCsrf(cfg: WebConfig): MiddlewareHandler;
//# sourceMappingURL=auth.d.ts.map