import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { loadWebConfig } from './config.js';
import {
  getSessionUser,
  handleCallback,
  logout,
  requireAuth,
  startLogin,
  type SessionUser,
} from './auth.js';
import { loadWebPlugins, type WebPlugin } from './plugins.js';
import { readEnabled, readValues, ValidationError, writeEnabled, writeValues } from './store.js';
import { listGuildChannels } from './channels.js';
import { editorPage, loginPage } from './ui.js';

type Env = { Variables: { user: SessionUser } };

async function main(): Promise<void> {
  const cfg = loadWebConfig();
  const plugins = await loadWebPlugins();
  const byNamespace = new Map<string, WebPlugin>(plugins.map((p) => [p.namespace, p]));

  console.log(`[web] Loaded ${plugins.length} editable module(s).`);

  const app = new Hono<Env>();

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

  // --- Editor page ------------------------------------------------------------
  app.get('/', async (c) => {
    const user = await getSessionUser(c, cfg);
    if (!user) return c.html(loginPage(cfg.botName));
    return c.html(editorPage(cfg.botName, user));
  });

  // --- API (auth required) ----------------------------------------------------
  const api = new Hono<Env>();
  api.use('*', requireAuth(cfg));

  api.get('/modules', (c) => {
    const payload = plugins.map((p) => ({
      namespace: p.namespace,
      title: p.title,
      description: p.description,
      fields: p.fields,
      values: readValues(p),
      enabled: readEnabled(p.namespace),
    }));
    return c.json(payload);
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
  serve({ fetch: app.fetch, port: cfg.port }, (info) => {
    console.log(`[web] Admin interface listening on http://0.0.0.0:${info.port}`);
  });
}

main().catch((err) => {
  console.error('[web] Fatal startup error:', err);
  process.exit(1);
});
