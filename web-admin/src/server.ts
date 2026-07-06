import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { serve } from "@hono/node-server";
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
  type SessionUser,
} from "./auth.js";
import { loadWebPlugins, type WebPlugin } from "./plugins.js";
import { loginPage } from "./ui.js";
import { EditorPage } from "./ui/editor-page.js";
import { registerHtmxRoutes } from "./ui/editor/routes.js";

type Env = { Variables: { user: SessionUser } };

async function main(): Promise<void> {
  const cfg = loadWebConfig();
  const plugins = await loadWebPlugins();
  const byNamespace = new Map<string, WebPlugin>(
    plugins.map((p) => [p.namespace, p]),
  );

  console.log(`[web] Loaded ${plugins.length} editable module(s).`);

  const app = new Hono<Env>();

  app.use("*", async (c, next) => {
    await next();
    c.header("X-Content-Type-Options", "nosniff");
    c.header("Referrer-Policy", "strict-origin-when-cross-origin");
    c.header("Content-Security-Policy", "frame-ancestors 'none'");
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

  // --- Auth routes (public) ---------------------------------------------------
  app.get("/login", (c) => startLogin(c, cfg));

  app.get("/callback", async (c) => {
    const result = await handleCallback(c, cfg);
    if (result.ok) return c.redirect("/");
    return c.html(
      loginPage(cfg.botName, result.message),
      result.status as 400 | 403 | 502,
    );
  });

  app.get("/logout", (c) => {
    logout(c);
    return c.redirect("/login");
  });

  app.post("/logout", async (c) => {
    const body = await c.req.parseBody();
    const formToken = typeof body._csrf === "string" ? body._csrf : "";
    if (!(await verifyFormCsrf(c, cfg, formToken))) {
      return c.text("Invalid CSRF token.", 403);
    }
    logout(c);
    return c.redirect("/login");
  });

  // --- Editor page ------------------------------------------------------------
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

  // Binds 0.0.0.0 for the Caddy-proxied deployment: docker-compose publishes no
  // host port and only exposes this via the internal caddy network (TLS + auth in
  // front). Don't publish a host port without putting access control ahead of it.
  const server = serve({ fetch: app.fetch, port: cfg.port }, (info) => {
    console.log(
      `[web] Admin interface listening on http://0.0.0.0:${info.port}`,
    );
  });

  // Graceful shutdown: Docker sends SIGTERM on `compose up --build`/stop. Without
  // this the process ignores it and Docker waits the full stop grace period before
  // SIGKILL, slowing container recreation. Close the server and exit promptly; a
  // short timer guarantees exit even if close() hangs on a lingering connection.
  let shuttingDown = false;
  const shutdown = (signal: NodeJS.Signals) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`[web] Received ${signal}; shutting down...`);

    const forceExit = setTimeout(() => {
      console.warn("[web] Shutdown timed out; forcing exit.");
      process.exit(0);
    }, 5000);
    forceExit.unref();

    server.close((err) => {
      if (err) console.error("[web] Error during shutdown:", err);
      clearTimeout(forceExit);
      process.exit(0);
    });
  };

  process.once("SIGTERM", () => shutdown("SIGTERM"));
  process.once("SIGINT", () => shutdown("SIGINT"));
}

main().catch((err) => {
  console.error("[web] Fatal startup error:", err);
  process.exit(1);
});
