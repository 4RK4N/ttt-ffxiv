import type { SessionUser } from "./auth.js";

export type AppEnv = {
  Variables: { user: SessionUser; cspNonce: string };
};
