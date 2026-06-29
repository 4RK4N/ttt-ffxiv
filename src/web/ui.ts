import type { SessionUser } from './auth.js';

const STYLES = `
  :root {
    --bg: #0f1115; --panel: #171a21; --panel-2: #1d212b; --border: #2a2f3a;
    --text: #e6e9ef; --muted: #97a0b0; --accent: #5865f2; --accent-hover: #4752c4;
    --ok: #3ba55d; --err: #ed4245; --radius: 12px;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; background: var(--bg); color: var(--text);
    font: 15px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }
  header {
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
    padding: 18px 24px; border-bottom: 1px solid var(--border);
    background: var(--panel); position: sticky; top: 0; z-index: 10;
  }
  header h1 { font-size: 18px; margin: 0; }
  header .who { color: var(--muted); font-size: 13px; }
  header a.logout {
    color: var(--muted); text-decoration: none; font-size: 13px; border: 1px solid var(--border);
    padding: 6px 12px; border-radius: 8px;
  }
  header a.logout:hover { color: var(--text); border-color: var(--accent); }
  main { max-width: 860px; margin: 0 auto; padding: 24px; }
  .module {
    background: var(--panel); border: 1px solid var(--border); border-radius: var(--radius);
    padding: 20px 22px; margin-bottom: 22px;
  }
  .module h2 { margin: 0 0 4px; font-size: 17px; }
  .module .desc { color: var(--muted); margin: 0 0 16px; font-size: 14px; }
  .field { margin-bottom: 16px; }
  .field label { display: block; font-weight: 600; margin-bottom: 6px; font-size: 14px; }
  .field .help { color: var(--muted); font-size: 12px; margin-bottom: 6px; }
  .field input, .field textarea {
    width: 100%; background: var(--panel-2); color: var(--text);
    border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px;
    font: inherit; resize: vertical;
  }
  .field textarea { min-height: 110px; }
  .field input:focus, .field textarea:focus { outline: none; border-color: var(--accent); }
  .actions { display: flex; align-items: center; gap: 12px; margin-top: 6px; }
  button {
    background: var(--accent); color: #fff; border: none; border-radius: 8px;
    padding: 10px 18px; font: inherit; font-weight: 600; cursor: pointer;
  }
  button:hover { background: var(--accent-hover); }
  button:disabled { opacity: .6; cursor: default; }
  .status { font-size: 13px; }
  .status.ok { color: var(--ok); }
  .status.err { color: var(--err); }
  .empty, .loading { color: var(--muted); text-align: center; padding: 40px; }
  .login-wrap { max-width: 420px; margin: 12vh auto; text-align: center; padding: 24px; }
  .login-card {
    background: var(--panel); border: 1px solid var(--border); border-radius: var(--radius); padding: 36px 28px;
  }
  .login-card h1 { margin: 0 0 8px; font-size: 22px; }
  .login-card p { color: var(--muted); margin: 0 0 24px; }
  .login-card .note { color: var(--err); margin: 0 0 20px; font-size: 14px; }
  a.btn {
    display: inline-block; background: var(--accent); color: #fff; text-decoration: none;
    padding: 12px 22px; border-radius: 8px; font-weight: 600;
  }
  a.btn:hover { background: var(--accent-hover); }
`;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Builds the page title from the configured bot name. */
function appTitle(botName: string): string {
  return `${botName} Admin Interface`;
}

/** Login / access-denied page. `message` shows an error (e.g. not an admin). */
export function loginPage(botName: string, message?: string): string {
  const title = escapeHtml(appTitle(botName));
  const note = message ? `<p class="note">${escapeHtml(message)}</p>` : '';
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<style>${STYLES}</style>
</head><body>
  <div class="login-wrap">
    <div class="login-card">
      <h1>${title}</h1>
      <p>Sign in with Discord. Server administrators only.</p>
      ${note}
      <a class="btn" href="/login">Login with Discord</a>
    </div>
  </div>
</body></html>`;
}

/** Main editor shell. Data is loaded client-side from /api/modules. */
export function editorPage(botName: string, user: SessionUser): string {
  const title = escapeHtml(appTitle(botName));
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<style>${STYLES}</style>
</head><body>
  <header>
    <h1>${title}</h1>
    <div style="display:flex;align-items:center;gap:14px;">
      <span class="who">Signed in as ${escapeHtml(user.username)}</span>
      <a class="logout" href="/logout">Log out</a>
    </div>
  </header>
  <main id="app"><div class="loading">Loading modules...</div></main>
  <script>${CLIENT_JS}</script>
</body></html>`;
}

// Client-side renderer. Kept as a string so no separate static asset/build step
// is needed. Values are set via DOM properties (not innerHTML) to avoid injection.
const CLIENT_JS = `
(function () {
  const app = document.getElementById('app');

  function field(ns, f, value) {
    const wrap = document.createElement('div');
    wrap.className = 'field';
    const label = document.createElement('label');
    label.textContent = f.label;
    label.htmlFor = ns + '__' + f.key;
    wrap.appendChild(label);
    if (f.help) {
      const help = document.createElement('div');
      help.className = 'help';
      help.textContent = f.help;
      wrap.appendChild(help);
    }
    const input = f.type === 'textarea' ? document.createElement('textarea') : document.createElement('input');
    if (input.tagName === 'INPUT') input.type = 'text';
    input.id = ns + '__' + f.key;
    input.dataset.key = f.key;
    input.value = value || '';
    wrap.appendChild(input);
    return wrap;
  }

  function moduleSection(mod) {
    const section = document.createElement('section');
    section.className = 'module';
    const h = document.createElement('h2');
    h.textContent = mod.title;
    section.appendChild(h);
    if (mod.description) {
      const d = document.createElement('p');
      d.className = 'desc';
      d.textContent = mod.description;
      section.appendChild(d);
    }

    const inputs = [];
    mod.fields.forEach(function (f) {
      const node = field(mod.namespace, f, mod.values[f.key]);
      section.appendChild(node);
      inputs.push(node.querySelector('input, textarea'));
    });

    const actions = document.createElement('div');
    actions.className = 'actions';
    const btn = document.createElement('button');
    btn.textContent = 'Save';
    const status = document.createElement('span');
    status.className = 'status';
    actions.appendChild(btn);
    actions.appendChild(status);
    section.appendChild(actions);

    btn.addEventListener('click', async function () {
      const payload = {};
      inputs.forEach(function (el) { payload[el.dataset.key] = el.value; });
      btn.disabled = true;
      status.className = 'status';
      status.textContent = 'Saving...';
      try {
        const res = await fetch('/api/texts/' + encodeURIComponent(mod.namespace), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json().catch(function () { return {}; });
          throw new Error(err.error || ('HTTP ' + res.status));
        }
        status.className = 'status ok';
        status.textContent = 'Saved';
      } catch (e) {
        status.className = 'status err';
        status.textContent = 'Error: ' + e.message;
      } finally {
        btn.disabled = false;
      }
    });

    return section;
  }

  fetch('/api/modules')
    .then(function (r) {
      if (r.status === 401) { window.location.href = '/login'; throw new Error('unauthorized'); }
      return r.json();
    })
    .then(function (mods) {
      app.innerHTML = '';
      if (!mods.length) {
        const e = document.createElement('div');
        e.className = 'empty';
        e.textContent = 'No editable modules found.';
        app.appendChild(e);
        return;
      }
      mods.forEach(function (mod) { app.appendChild(moduleSection(mod)); });
    })
    .catch(function (e) {
      if (e.message === 'unauthorized') return;
      app.innerHTML = '';
      const d = document.createElement('div');
      d.className = 'empty';
      d.textContent = 'Failed to load modules: ' + e.message;
      app.appendChild(d);
    });
})();
`;
