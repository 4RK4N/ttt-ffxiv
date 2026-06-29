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
  .layout { display: flex; align-items: flex-start; gap: 0; min-height: calc(100vh - 61px); }
  .sidebar {
    flex: 0 0 240px; border-right: 1px solid var(--border); background: var(--panel);
    padding: 16px 12px; position: sticky; top: 61px; align-self: stretch;
  }
  .sidebar .nav-title {
    color: var(--muted); font-size: 11px; text-transform: uppercase; letter-spacing: .06em;
    padding: 0 10px 8px;
  }
  .tab {
    display: block; width: 100%; text-align: left; background: transparent; color: var(--text);
    border: 1px solid transparent; border-radius: 8px; padding: 9px 10px; margin-bottom: 2px;
    font: inherit; cursor: pointer;
  }
  .tab:hover { background: var(--panel-2); }
  .tab.active { background: var(--panel-2); border-color: var(--accent); }
  .content { flex: 1; min-width: 0; padding: 24px; max-width: 820px; }
  .module h2 { margin: 0 0 4px; font-size: 19px; }
  .module .desc { color: var(--muted); margin: 0 0 20px; font-size: 14px; }
  .panel { display: none; }
  .panel.active { display: block; }
  .field { margin-bottom: 16px; }
  .field label { display: block; font-weight: 600; margin-bottom: 6px; font-size: 14px; }
  .field .help { color: var(--muted); font-size: 12px; margin-bottom: 6px; }
  .field input, .field textarea, .field select {
    width: 100%; background: var(--panel-2); color: var(--text);
    border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px;
    font: inherit; resize: vertical;
  }
  .field textarea { min-height: 110px; }
  .field input:focus, .field textarea:focus, .field select:focus { outline: none; border-color: var(--accent); }
  .checklist {
    background: var(--panel-2); border: 1px solid var(--border); border-radius: 8px;
    padding: 8px 12px; max-height: 240px; overflow-y: auto;
  }
  .checklist label {
    display: flex; align-items: center; gap: 8px; font-weight: 400; margin: 0; padding: 4px 0;
    cursor: pointer;
  }
  .checklist input { width: auto; }
  .channel-note { color: var(--err); font-size: 12px; margin-top: 6px; }
  .actions { display: flex; align-items: center; gap: 12px; margin-top: 6px; }
  button.save {
    background: var(--accent); color: #fff; border: none; border-radius: 8px;
    padding: 10px 18px; font: inherit; font-weight: 600; cursor: pointer;
  }
  button.save:hover { background: var(--accent-hover); }
  button.save:disabled { opacity: .6; cursor: default; }
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
  @media (max-width: 720px) {
    .layout { flex-direction: column; }
    .sidebar { flex-basis: auto; width: 100%; position: static; border-right: none; border-bottom: 1px solid var(--border); }
    .content { padding: 18px; }
  }
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
  <div id="app"><div class="loading">Loading modules...</div></div>
  <script>${CLIENT_JS}</script>
</body></html>`;
}

// Client-side renderer. Kept as a string so no separate static asset/build step
// is needed. Values are set via DOM properties (not innerHTML) to avoid injection.
const CLIENT_JS = `
(function () {
  const app = document.getElementById('app');

  // Channels are loaded once and shared by all channel pickers. On failure we
  // keep the editor usable by falling back to a plain text input.
  var channels = [];
  var channelsError = null;

  function el(tag, className) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  }

  function channelLabel(ch) {
    return '#' + ch.name;
  }

  // Returns { node, getValue } for one field.
  function buildField(ns, f, value) {
    var wrap = el('div', 'field');
    var label = el('label');
    label.textContent = f.label;
    wrap.appendChild(label);
    if (f.help) {
      var help = el('div', 'help');
      help.textContent = f.help;
      wrap.appendChild(help);
    }

    if (f.type === 'channel') {
      if (channelsError) return textFallback(wrap, f, value, true);
      var select = el('select');
      var none = el('option');
      none.value = '';
      none.textContent = '\u2014 none \u2014';
      select.appendChild(none);
      channels.forEach(function (ch) {
        var opt = el('option');
        opt.value = ch.id;
        opt.textContent = channelLabel(ch);
        if (ch.id === value) opt.selected = true;
        select.appendChild(opt);
      });
      // Preserve an unknown/stale id so saving doesn't silently drop it.
      if (value && !channels.some(function (ch) { return ch.id === value; })) {
        var stale = el('option');
        stale.value = value;
        stale.textContent = value + ' (not found)';
        stale.selected = true;
        select.appendChild(stale);
      }
      wrap.appendChild(select);
      return { node: wrap, getValue: function () { return select.value; } };
    }

    if (f.type === 'channel-multi') {
      if (channelsError) return textFallback(wrap, f, value, true);
      var selected = Array.isArray(value) ? value.slice() : [];
      var list = el('div', 'checklist');
      var boxes = [];
      channels.forEach(function (ch) {
        var row = el('label');
        var cb = el('input');
        cb.type = 'checkbox';
        cb.value = ch.id;
        if (selected.indexOf(ch.id) !== -1) cb.checked = true;
        boxes.push(cb);
        var span = el('span');
        span.textContent = channelLabel(ch);
        row.appendChild(cb);
        row.appendChild(span);
        list.appendChild(row);
      });
      // Keep any selected ids that aren't in the current channel list.
      selected.forEach(function (id) {
        if (channels.some(function (ch) { return ch.id === id; })) return;
        var row = el('label');
        var cb = el('input');
        cb.type = 'checkbox';
        cb.value = id;
        cb.checked = true;
        boxes.push(cb);
        var span = el('span');
        span.textContent = id + ' (not found)';
        row.appendChild(cb);
        row.appendChild(span);
        list.appendChild(row);
      });
      if (!channels.length) {
        var empty = el('div', 'help');
        empty.textContent = 'No channels available.';
        list.appendChild(empty);
      }
      wrap.appendChild(list);
      return {
        node: wrap,
        getValue: function () {
          return boxes.filter(function (b) { return b.checked; }).map(function (b) { return b.value; });
        }
      };
    }

    return textFallback(wrap, f, value, false);
  }

  // Plain text/textarea input. Also used as the fallback for channel fields when
  // the channel list could not be loaded.
  function textFallback(wrap, f, value, channelFallback) {
    var input = f.type === 'textarea' ? el('textarea') : el('input');
    if (input.tagName === 'INPUT') input.type = 'text';
    var isMulti = f.type === 'channel-multi';
    input.value = isMulti ? (Array.isArray(value) ? value.join(', ') : '') : (value || '');
    wrap.appendChild(input);
    if (channelFallback) {
      var note = el('div', 'channel-note');
      note.textContent = channelsError + ' Enter channel id(s) manually' + (isMulti ? ' (comma-separated).' : '.');
      wrap.appendChild(note);
    }
    return {
      node: wrap,
      getValue: function () {
        if (isMulti) {
          return input.value.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
        }
        return input.value;
      }
    };
  }

  function buildPanel(mod) {
    var panel = el('section', 'panel');
    panel.dataset.ns = mod.namespace;
    var inner = el('div', 'module');
    var h = el('h2');
    h.textContent = mod.title;
    inner.appendChild(h);
    if (mod.description) {
      var d = el('p', 'desc');
      d.textContent = mod.description;
      inner.appendChild(d);
    }

    var fields = [];
    mod.fields.forEach(function (f) {
      var built = buildField(mod.namespace, f, mod.values[f.key]);
      inner.appendChild(built.node);
      fields.push({ key: f.key, getValue: built.getValue });
    });

    var actions = el('div', 'actions');
    var btn = el('button', 'save');
    btn.textContent = 'Save';
    var status = el('span', 'status');
    actions.appendChild(btn);
    actions.appendChild(status);
    inner.appendChild(actions);
    panel.appendChild(inner);

    btn.addEventListener('click', async function () {
      var payload = {};
      fields.forEach(function (f) { payload[f.key] = f.getValue(); });
      btn.disabled = true;
      status.className = 'status';
      status.textContent = 'Saving...';
      try {
        var res = await fetch('/api/modules/' + encodeURIComponent(mod.namespace), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          var err = await res.json().catch(function () { return {}; });
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

    return panel;
  }

  function render(mods) {
    app.innerHTML = '';
    if (!mods.length) {
      var e = el('div', 'empty');
      e.textContent = 'No editable modules found.';
      app.appendChild(e);
      return;
    }

    var layout = el('div', 'layout');
    var sidebar = el('nav', 'sidebar');
    var navTitle = el('div', 'nav-title');
    navTitle.textContent = 'Modules';
    sidebar.appendChild(navTitle);
    var content = el('div', 'content');

    var tabs = [];
    var panels = [];

    function activate(i) {
      tabs.forEach(function (t, j) { t.classList.toggle('active', i === j); });
      panels.forEach(function (p, j) { p.classList.toggle('active', i === j); });
    }

    mods.forEach(function (mod, i) {
      var tab = el('button', 'tab');
      tab.type = 'button';
      tab.textContent = mod.title;
      tab.addEventListener('click', function () { activate(i); });
      sidebar.appendChild(tab);
      tabs.push(tab);

      var panel = buildPanel(mod);
      content.appendChild(panel);
      panels.push(panel);
    });

    layout.appendChild(sidebar);
    layout.appendChild(content);
    app.appendChild(layout);
    activate(0);
  }

  Promise.all([
    fetch('/api/modules').then(function (r) {
      if (r.status === 401) { window.location.href = '/login'; throw new Error('unauthorized'); }
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }),
    fetch('/api/channels').then(function (r) {
      if (!r.ok) return null;
      return r.json();
    }).catch(function () { return null; })
  ])
    .then(function (results) {
      var mods = results[0];
      var chans = results[1];
      if (Array.isArray(chans)) {
        channels = chans;
      } else {
        channelsError = 'Could not load channels.';
      }
      render(mods);
    })
    .catch(function (e) {
      if (e.message === 'unauthorized') return;
      app.innerHTML = '';
      var d = el('div', 'empty');
      d.textContent = 'Failed to load modules: ' + e.message;
      app.appendChild(d);
    });
})();
`;
