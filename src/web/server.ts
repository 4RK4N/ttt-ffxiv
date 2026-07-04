import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { loadWebConfig } from './config.js';
import {
  ensureCsrfToken,
  getSessionUser,
  handleCallback,
  logout,
  requireAuth,
  requireCsrf,
  startLogin,
  verifyFormCsrf,
  type SessionUser,
} from './auth.js';
import { loadWebPlugins, hasPublishableField, type WebPlugin } from './plugins.js';
import { readEnabled, readValues, DataReadError, ValidationError, writeEnabled, writeValues } from './store.js';
import { listGuildChannels } from './channels.js';
import { listGuildRoles } from './roles.js';
import { getPublishHandlers } from './publishHandlers.js';
import { editorPage, loginPage } from './ui.js';

type Env = { Variables: { user: SessionUser } };

async function main(): Promise<void> {
  const cfg = loadWebConfig();
  const plugins = await loadWebPlugins();
  const byNamespace = new Map<string, WebPlugin>(plugins.map((p) => [p.namespace, p]));

  console.log(`[web] Loaded ${plugins.length} editable module(s).`);

  const app = new Hono<Env>();

  const cssDir = join(dirname(fileURLToPath(import.meta.url)), 'ui', 'css');

  function findProjectRoot(start: string): string {
    let dir = start;
    for (; ;) {
      if (existsSync(join(dir, 'package.json'))) return dir;
      const parent = dirname(dir);
      if (parent === dir) return start;
      dir = parent;
    }
  }

  function resolveCssFile(file: string): string | null {
    const local = resolve(cssDir, file);
    if (local.startsWith(resolve(cssDir)) && existsSync(local)) return local;
    if (file !== 'tabler.min.css') return null;
    const tabler = join(
      findProjectRoot(dirname(fileURLToPath(import.meta.url))),
      'node_modules',
      '@tabler',
      'core',
      'dist',
      'css',
      'tabler.min.css',
    );
    return existsSync(tabler) ? tabler : null;
  }

  app.get('/assets/css/:file', (c) => {
    const file = c.req.param('file');
    if (!file || !/^[\w-]+\.css$/.test(file)) {
      return c.text('Not found', 404);
    }
    const filePath = resolveCssFile(file);
    if (!filePath) {
      return c.text('Not found', 404);
    }
    try {
      const body = readFileSync(filePath, 'utf8');
      return c.body(body, 200, {
        'Content-Type': 'text/css; charset=utf-8',
        'Cache-Control': 'no-cache',
      });
    } catch {
      return c.text('Not found', 404);
    }
  });

  // --- Auth routes (public) ---------------------------------------------------
  app.get('/login', (c) => startLogin(c, cfg));

  app.get('/callback', async (c) => {
    const result = await handleCallback(c, cfg);
    if (result.ok) return c.redirect('/');
    return c.html(loginPage(cfg.botName, result.message), result.status as 400 | 403 | 502);
  });

  app.get('/logout', (c) => {
    logout(c);
    return c.redirect('/login');
  });

  app.post('/logout', async (c) => {
    const body = await c.req.parseBody();
    const formToken = typeof body._csrf === 'string' ? body._csrf : '';
    if (!(await verifyFormCsrf(c, cfg, formToken))) {
      return c.text('Invalid CSRF token.', 403);
    }
    logout(c);
    return c.redirect('/login');
  });

  // --- Editor page ------------------------------------------------------------
  app.get('/', async (c) => {
    const user = await getSessionUser(c, cfg);
    if (!user) return c.html(loginPage(cfg.botName));
    const csrfToken = await ensureCsrfToken(c, cfg);
    return c.html(editorPage(cfg.botName, user, csrfToken));
  });

  // --- API (auth required) ----------------------------------------------------
  const api = new Hono<Env>();
  api.use('*', requireAuth(cfg));
  api.use('*', requireCsrf(cfg));

  api.get('/modules', (c) => {
    try {
      const payload = plugins.map((p) => ({
        namespace: p.namespace,
        title: p.title,
        description: p.description,
        fields: p.fields,
        values: readValues(p),
        enabled: readEnabled(p.namespace),
      }));
      return c.json(payload);
    } catch (err) {
      if (err instanceof DataReadError) {
        return c.json({ error: err.message }, 502);
      }
      throw err;
    }
  });

  api.get('/channels', async (c) => {
    try {
      const channels = await listGuildChannels(cfg);
      return c.json(channels);
    } catch (err) {
      console.error('[web] Failed to list guild channels:', err);
      return c.json({ error: 'Could not load channels from Discord.' }, 502);
    }
  });

  api.get('/roles', async (c) => {
    try {
      const roles = await listGuildRoles(cfg);
      return c.json(roles);
    } catch (err) {
      console.error('[web] Failed to list guild roles:', err);
      return c.json({ error: 'Could not load roles from Discord.' }, 502);
    }
  });

  api.post('/modules/:namespace/publish/:itemId', async (c) => {
    const namespace = c.req.param('namespace');
    const itemId = c.req.param('itemId');
    const plugin = byNamespace.get(namespace);
    if (!plugin || !hasPublishableField(plugin)) {
      return c.json({ error: `Module "${namespace}" does not support publishing.` }, 404);
    }
    const handlers = getPublishHandlers(namespace);
    if (!handlers) {
      return c.json({ error: `No publish handler registered for "${namespace}".` }, 501);
    }
    try {
      await handlers.publish({ botToken: cfg.botToken }, itemId);
      console.log(`[web] ${c.get('user').username} published ${namespace} panel "${itemId}".`);
      return c.json({ ok: true });
    } catch (err) {
      console.error(`[web] Publish failed for "${namespace}/${itemId}":`, err);
      return c.json({ error: 'Failed to publish panel.' }, 400);
    }
  });

  api.post('/modules/:namespace/unpublish/:itemId', async (c) => {
    const namespace = c.req.param('namespace');
    const itemId = c.req.param('itemId');
    const plugin = byNamespace.get(namespace);
    if (!plugin || !hasPublishableField(plugin)) {
      return c.json({ error: `Module "${namespace}" does not support unpublishing.` }, 404);
    }
    const handlers = getPublishHandlers(namespace);
    if (!handlers) {
      return c.json({ error: `No unpublish handler registered for "${namespace}".` }, 501);
    }
    try {
      await handlers.unpublish(itemId);
      console.log(`[web] ${c.get('user').username} unpublished ${namespace} panel "${itemId}".`);
      return c.json({ ok: true });
    } catch (err) {
      console.error(`[web] Unpublish failed for "${namespace}/${itemId}":`, err);
      return c.json({ error: 'Failed to unpublish panel.' }, 400);
    }
  });

  api.put('/modules/:namespace', async (c) => {
    const namespace = c.req.param('namespace');
    const plugin = byNamespace.get(namespace);
    if (!plugin) return c.json({ error: `Unknown module "${namespace}".` }, 404);

    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Request body must be valid JSON.' }, 400);
    }

    try {
      const saved = await writeValues(plugin, body);
      console.log(`[web] ${c.get('user').username} updated settings for "${namespace}".`);
      return c.json({ ok: true, values: saved });
    } catch (err) {
      if (err instanceof ValidationError) {
        return c.json({ error: err.message }, 400);
      }
      if (err instanceof DataReadError) {
        return c.json({ error: err.message }, 502);
      }
      console.error(`[web] Failed to write settings for "${namespace}":`, err);
      return c.json({ error: 'Failed to save changes.' }, 500);
    }
  });

  api.put('/modules/:namespace/enabled', async (c) => {
    const namespace = c.req.param('namespace');
    if (!byNamespace.has(namespace)) {
      return c.json({ error: `Unknown module "${namespace}".` }, 404);
    }

    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Request body must be valid JSON.' }, 400);
    }

    const enabled = (body as { enabled?: unknown })?.enabled;
    if (typeof enabled !== 'boolean') {
      return c.json({ error: 'Field "enabled" must be a boolean.' }, 400);
    }

    try {
      const saved = await writeEnabled(namespace, enabled);
      console.log(
        `[web] ${c.get('user').username} ${saved ? 'enabled' : 'disabled'} module "${namespace}".`
      );
      return c.json({ ok: true, enabled: saved });
    } catch (err) {
      console.error(`[web] Failed to set enabled for "${namespace}":`, err);
      return c.json({ error: 'Failed to save changes.' }, 500);
    }
  });

  app.route('/api', api);

  // Binds 0.0.0.0 for the Caddy-proxied deployment: docker-compose publishes no
  // host port and only exposes this via the internal caddy network (TLS + auth in
  // front). Don't publish a host port without putting access control ahead of it.
  const server = serve({ fetch: app.fetch, port: cfg.port }, (info) => {
    console.log(`[web] Admin interface listening on http://0.0.0.0:${info.port}`);
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
      console.warn('[web] Shutdown timed out; forcing exit.');
      process.exit(0);
    }, 5000);
    forceExit.unref();

    server.close((err) => {
      if (err) console.error('[web] Error during shutdown:', err);
      clearTimeout(forceExit);
      process.exit(0);
    });
  };

  process.once('SIGTERM', () => shutdown('SIGTERM'));
  process.once('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  console.error('[web] Fatal startup error:', err);
  process.exit(1);
});
