import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { serve, type ServerType } from "@hono/node-server";
import { Hono } from "hono";
import { loadWebConfig } from "./config.js";
import {
  ensureCsrfToken,
  getAuthorizedSessionUser,
  handleCallback,
  logout,
  requireAuth,
  requireCsrf,
  startLogin,
  verifyFormCsrf,
} from "./auth.js";
import { loadWebPlugins, type WebPlugin } from "./plugins.js";
import { loginPage } from "./ui.js";
import { EditorPage } from "./ui/editor-page.js";
import { registerHtmxRoutes } from "./ui/editor/routes.js";
import { buildCspHeader, generateCspNonce } from "./csp.js";
import type { AppEnv } from "./env.js";

type Env = AppEnv;

export interface WebRuntime {
  close: () => Promise<void>;
}

export async function startWeb(): Promise<WebRuntime> {
  const cfg = loadWebConfig();
  const plugins = await loadWebPlugins();
  const byNamespace = new Map<string, WebPlugin>(
    plugins.map((p) => [p.namespace, p]),
  );

  console.log(`[web] Loaded ${plugins.length} editable module(s).`);

  const app = new Hono<Env>();

  app.use("*", async (c, next) => {
    const nonce = generateCspNonce();
    c.set("cspNonce", nonce);
    await next();
    c.header("X-Content-Type-Options", "nosniff");
    c.header("Referrer-Policy", "strict-origin-when-cross-origin");
    c.header("Content-Security-Policy", buildCspHeader(nonce));
    c.header("X-Frame-Options", "DENY");
  });

  app.onError((err, c) => {
    console.error("[web] Unhandled route error:", err);
    return c.text("Something went wrong. Please try again.", 500);
  });

  const cssDir = join(dirname(fileURLToPath(import.meta.url)), "ui", "css");
  const jsDir = join(dirname(fileURLToPath(import.meta.url)), "ui", "js");

  function resolveCssFile(file: string): string | null {
    const local = resolve(cssDir, file);
    if (local.startsWith(resolve(cssDir)) && existsSync(local)) return local;
    return null;
  }

  function resolveJsFile(file: string): string | null {
    const local = resolve(jsDir, file);
    if (local.startsWith(resolve(jsDir)) && existsSync(local)) return local;
    return null;
  }

  if (!resolveCssFile("admin.min.css")) {
    console.warn("[web] admin.min.css missing; rebuild with npm run build.");
  }
  if (!resolveJsFile("admin.min.js")) {
    console.warn("[web] admin.min.js missing; rebuild with npm run build.");
  }

  app.get("/health", (c) => c.json({ ok: true }));

  app.get("/assets/css/:file", (c) => {
    const file = c.req.param("file");
    if (!file || !/^[\w.-]+\.css$/.test(file)) {
      return c.text("Not found", 404);
    }
    const filePath = resolveCssFile(file);
    if (!filePath) {
      return c.text("Not found", 404);
    }
    try {
      const body = readFileSync(filePath, "utf8");
      return c.body(body, 200, {
        "Content-Type": "text/css; charset=utf-8",
        "Cache-Control": "no-cache",
      });
    } catch {
      return c.text("Not found", 404);
    }
  });

  app.get("/assets/js/:file", (c) => {
    const file = c.req.param("file");
    if (!file || !/^[\w.-]+\.js$/.test(file)) {
      return c.text("Not found", 404);
    }
    const filePath = resolveJsFile(file);
    if (!filePath) {
      return c.text("Not found", 404);
    }
    try {
      const body = readFileSync(filePath, "utf8");
      return c.body(body, 200, {
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": "no-cache",
      });
    } catch {
      return c.text("Not found", 404);
    }
  });

  app.get("/login", (c) => startLogin(c, cfg));

  app.get("/callback", async (c) => {
    const result = await handleCallback(c, cfg);
    if (result.ok) return c.redirect("/");
    return c.html(
      loginPage(cfg.botName, result.message),
      result.status as 400 | 403 | 502,
    );
  });

  app.post("/logout", async (c) => {
    const body = await c.req.parseBody();
    const formToken = typeof body._csrf === "string" ? body._csrf : "";
    if (!(await verifyFormCsrf(c, cfg, formToken))) {
      return c.text("Invalid CSRF token.", 403);
    }
    logout(c);
    return c.redirect("/");
  });

  app.get("/", async (c) => {
    const user = await getAuthorizedSessionUser(c, cfg);
    if (!user) return c.html(loginPage(cfg.botName));
    const csrfToken = await ensureCsrfToken(c, cfg);
    const active = c.req.query("module") ?? plugins[0]?.namespace;
    return c.html(
      await EditorPage({
        cfg,
        user,
        csrfToken,
        cspNonce: c.get("cspNonce"),
        plugins,
        activeNamespace: active,
      }),
    );
  });

  const htmx = new Hono<Env>();
  htmx.use("*", requireAuth(cfg));
  htmx.use("*", requireCsrf(cfg));
  registerHtmxRoutes(htmx, { cfg, byNamespace });

  app.route("/htmx", htmx);

  let server: ServerType | undefined;
  await new Promise<void>((resolve) => {
    server = serve({ fetch: app.fetch, port: cfg.port }, (info) => {
      console.log(
        `[web] Admin interface listening on http://0.0.0.0:${info.port}`,
      );
      resolve();
    });
  });

  return {
    close: () =>
      new Promise<void>((resolve, reject) => {
        if (!server) {
          resolve();
          return;
        }
        server.close((err) => (err ? reject(err) : resolve()));
      }),
  };
}
