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
  .tab .tab-dot {
    display: inline-block; width: 8px; height: 8px; border-radius: 50%;
    background: var(--ok); margin-right: 8px; vertical-align: middle;
  }
  .tab.off .tab-dot { background: var(--muted); }
  .tab.off .tab-text { color: var(--muted); }
  .content { flex: 1; min-width: 0; padding: 24px; max-width: 820px; }
  .module-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 4px; }
  .module-head h2 { margin: 0; }
  .module h2 { font-size: 19px; }
  .module .desc { color: var(--muted); margin: 0 0 20px; font-size: 14px; }
  .switch { display: inline-flex; align-items: center; gap: 8px; cursor: pointer; user-select: none; flex: 0 0 auto; }
  .switch input { position: absolute; opacity: 0; width: 0; height: 0; }
  .switch .track {
    width: 42px; height: 24px; background: var(--border); border-radius: 999px;
    transition: background .15s; position: relative; flex: 0 0 auto;
  }
  .switch .track::after {
    content: ''; position: absolute; top: 3px; left: 3px; width: 18px; height: 18px;
    border-radius: 50%; background: #fff; transition: transform .15s;
  }
  .switch input:checked + .track { background: var(--ok); }
  .switch input:checked + .track::after { transform: translateX(18px); }
  .switch input:focus-visible + .track { outline: 2px solid var(--accent); outline-offset: 2px; }
  .switch .switch-label { font-size: 13px; color: var(--muted); min-width: 24px; }
  .switch.busy { opacity: .6; }
  .switch-err { color: var(--err); font-size: 12px; margin: -8px 0 16px; }
  .panel { display: none; }
  .panel.active { display: block; }
  .field { margin-bottom: 16px; }
  .field > label:not(.switch) { display: block; font-weight: 600; margin-bottom: 6px; font-size: 14px; }
  .field .help { color: var(--muted); font-size: 12px; margin-bottom: 6px; }
  .field input[type="text"], .field textarea, .field select {
    width: 100%; background: var(--panel-2); color: var(--text);
    border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px;
    font: inherit; resize: vertical;
  }
  .field label.switch { margin-bottom: 0; font-weight: 400; }
  .field textarea { min-height: 110px; }
  .field input[type="text"]:focus, .field textarea:focus, .field select:focus { outline: none; border-color: var(--accent); }
  .field.disabled input[type="text"], .field.disabled textarea, .field.disabled select { opacity: .5; pointer-events: none; }
  .field.disabled .help-disabled { color: var(--muted); font-size: 12px; margin-top: 4px; }
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
  button.secondary {
    background: transparent; color: var(--text); border: 1px solid var(--border); border-radius: 8px;
    padding: 8px 14px; font: inherit; cursor: pointer;
  }
  button.secondary:hover { border-color: var(--accent); }
  button.secondary:disabled { opacity: .5; cursor: default; }
  button.danger { border-color: var(--err); color: var(--err); }
  .object-list { display: flex; flex-direction: column; gap: 16px; }
  .object-card {
    border: 1px solid var(--border); border-radius: 10px; padding: 16px; background: var(--panel-2);
  }
  .object-card-head {
    display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px;
  }
  .object-card.collapsed .object-card-head { margin-bottom: 0; }
  .object-card-head-toggle { cursor: pointer; user-select: none; }
  .object-card-head-toggle:hover h3 { color: var(--accent); }
  .object-card-head-left { display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1; }
  .object-card-head h3 { margin: 0; font-size: 15px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .collapse-chevron {
    flex: 0 0 auto; color: var(--muted); font-size: 11px; width: 14px; text-align: center;
  }
  .object-card.collapsed .object-card-body { display: none; }
  .badge {
    font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .04em;
    padding: 3px 8px; border-radius: 999px; border: 1px solid var(--border); color: var(--muted);
  }
  .badge.on { color: var(--ok); border-color: var(--ok); }
  .object-actions {
    display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px;
    margin-top: 12px;
  }
  .add-row { margin-top: 8px; }
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
export function editorPage(botName: string, user: SessionUser, csrfToken: string): string {
  const title = escapeHtml(appTitle(botName));
  const csrf = escapeHtml(csrfToken);
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="csrf-token" content="${csrf}" />
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
  var roles = [];
  var rolesError = null;

  function csrfHeaders(extra) {
    var meta = document.querySelector('meta[name="csrf-token"]');
    var token = meta ? meta.getAttribute('content') : '';
    var headers = { 'X-CSRF-Token': token || '' };
    if (extra) {
      for (var k in extra) headers[k] = extra[k];
    }
    return headers;
  }

  function el(tag, className) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  }

  function channelLabel(ch) {
    return '#' + ch.name;
  }

  function roleLabel(role) {
    return role.name;
  }

  function slugify(text) {
    return (text || 'ticket-type').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 32) || 'ticket-type';
  }

  function buildRoleSelect(wrap, value) {
    if (rolesError) return textFallback(wrap, { type: 'text' }, value, true);
    var select = el('select');
    var none = el('option');
    none.value = '';
    none.textContent = '\u2014 none \u2014';
    select.appendChild(none);
    roles.forEach(function (role) {
      var opt = el('option');
      opt.value = role.id;
      opt.textContent = roleLabel(role);
      if (role.id === value) opt.selected = true;
      select.appendChild(opt);
    });
    if (value && !roles.some(function (role) { return role.id === value; })) {
      var stale = el('option');
      stale.value = value;
      stale.textContent = value + ' (not found)';
      stale.selected = true;
      select.appendChild(stale);
    }
    wrap.appendChild(select);
    return { node: wrap, getValue: function () { return select.value; }, input: select };
  }

  function buildSelectControl(wrap, f, value) {
    var select = el('select');
    (f.options || []).forEach(function (opt) {
      var option = el('option');
      option.value = opt.value;
      option.textContent = opt.label;
      if (opt.value === value) option.selected = true;
      select.appendChild(option);
    });
    wrap.appendChild(select);
    return { node: wrap, getValue: function () { return select.value; }, input: select };
  }

  function buildToggleSwitch(checked, onChange) {
    var on = checked === true;
    var label = el('label', 'switch');
    var input = el('input');
    input.type = 'checkbox';
    input.checked = on;
    var track = el('span', 'track');
    var text = el('span', 'switch-label');
    function reflect(isOn) {
      text.textContent = isOn ? 'On' : 'Off';
    }
    reflect(on);
    label.appendChild(input);
    label.appendChild(track);
    label.appendChild(text);
    input.addEventListener('change', function () {
      reflect(input.checked);
      if (onChange) onChange(input.checked);
    });
    return {
      node: label,
      getValue: function () { return input.checked; },
      input: input,
      setChecked: function (v) { input.checked = v; reflect(v); }
    };
  }

  function buildBooleanControl(wrap, value) {
    var toggle = buildToggleSwitch(value);
    wrap.appendChild(toggle.node);
    return { node: wrap, getValue: toggle.getValue, input: toggle.input };
  }

  function buildOptionList(wrap, f, value) {
    var list = el('div', 'object-list');
    wrap.appendChild(list);
    var items = Array.isArray(value) ? value.slice() : [];
    var rows = [];

    function renderOptions() {
      list.innerHTML = '';
      rows = [];
      items.forEach(function (item, index) {
        var card = el('div', 'object-card');
        var subFields = [];
        (f.optionFields || []).forEach(function (sub) {
          var built = buildSubField(sub, item[sub.key]);
          card.appendChild(built.node);
          subFields.push({ key: sub.key, getValue: built.getValue });
        });
        var removeBtn = el('button', 'secondary danger');
        removeBtn.type = 'button';
        removeBtn.textContent = 'Remove';
        removeBtn.addEventListener('click', function () {
          items.splice(index, 1);
          renderOptions();
        });
        card.appendChild(removeBtn);
        rows.push({
          getValue: function () {
            var out = { id: item.id || '' };
            subFields.forEach(function (sf) { out[sf.key] = sf.getValue(); });
            if (!out.id) out.id = slugify(out.label || 'option');
            return out;
          }
        });
        list.appendChild(card);
      });
    }

    renderOptions();
    var addBtn = el('button', 'secondary add-row');
    addBtn.type = 'button';
    addBtn.textContent = 'Add option';
    addBtn.addEventListener('click', function () {
      items.push({ id: '', roleId: '', emoji: '', label: '' });
      renderOptions();
    });
    wrap.appendChild(addBtn);
    return {
      node: wrap,
      getValue: function () { return rows.map(function (r) { return r.getValue(); }); }
    };
  }

  function buildMultiChecklist(wrap, f, value, items, labelFn, emptyText, fallbackNote) {
    if (fallbackNote) return textFallback(wrap, f, value, true);
    var selected = Array.isArray(value) ? value.slice() : [];
    var list = el('div', 'checklist');
    var boxes = [];
    items.forEach(function (item) {
      var row = el('label');
      var cb = el('input');
      cb.type = 'checkbox';
      cb.value = item.id;
      if (selected.indexOf(item.id) !== -1) cb.checked = true;
      boxes.push(cb);
      var span = el('span');
      span.textContent = labelFn(item);
      row.appendChild(cb);
      row.appendChild(span);
      list.appendChild(row);
    });
    selected.forEach(function (id) {
      if (items.some(function (item) { return item.id === id; })) return;
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
    if (!items.length) {
      var empty = el('div', 'help');
      empty.textContent = emptyText;
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

  // Returns { node, getValue } for one field.
  function buildField(ns, f, value, saveModule) {
    if (f.type === 'object-list') {
      return buildObjectList(ns, f, value, saveModule);
    }

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
      return buildMultiChecklist(wrap, f, value, channels, channelLabel, 'No channels available.', channelsError);
    }

    if (f.type === 'role-multi') {
      return buildMultiChecklist(wrap, f, value, roles, roleLabel, 'No roles available.', rolesError);
    }

    if (f.type === 'role') {
      return buildRoleSelect(wrap, value);
    }

    if (f.type === 'select') {
      return buildSelectControl(wrap, f, value);
    }

    if (f.type === 'boolean') {
      return buildBooleanControl(wrap, value === true);
    }

    if (f.type === 'option-list') {
      return buildOptionList(wrap, f, value);
    }

    return textFallback(wrap, f, value, false);
  }

  function buildSubField(f, value) {
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
      return buildMultiChecklist(wrap, f, value, channels, channelLabel, 'No channels available.', channelsError);
    }

    if (f.type === 'role-multi') {
      return buildMultiChecklist(wrap, f, value, roles, roleLabel, 'No roles available.', rolesError);
    }

    if (f.type === 'role') {
      return buildRoleSelect(wrap, value);
    }

    if (f.type === 'select') {
      return buildSelectControl(wrap, f, value);
    }

    if (f.type === 'boolean') {
      return buildBooleanControl(wrap, value === true);
    }

    if (f.type === 'option-list') {
      return buildOptionList(wrap, f, value);
    }

    return textFallback(wrap, f, value, false);
  }

  function liveRowValues(subFields, item, f) {
    var out = { id: item.id || '' };
    subFields.forEach(function (sf) { out[sf.key] = sf.getValue(); });
    if (!out.id) out.id = slugify(out.openButtonLabel || out.panelTitle || (f && f.itemLabel) || 'item');
    return out;
  }

  function syncEphemeralField(subFields, ns) {
    if (ns !== 'reaction-roles') return;
    var reactionField = subFields.find(function (sf) { return sf.key === 'reactionType'; });
    var ephemeralField = subFields.find(function (sf) { return sf.key === 'ephemeralMessage'; });
    if (!reactionField || !ephemeralField) return;
    var reactionSelect = reactionField.node.querySelector('select');
    var ephemeralWrap = ephemeralField.node;
    var disabledNote = ephemeralWrap.querySelector('.help-disabled');
    function apply() {
      var isEmoji = reactionSelect && reactionSelect.value === 'emoji';
      ephemeralWrap.classList.toggle('disabled', isEmoji);
      if (isEmoji) {
        if (!disabledNote) {
          disabledNote = el('div', 'help-disabled');
          disabledNote.textContent = 'Not available for emoji reactions.';
          ephemeralWrap.appendChild(disabledNote);
        }
      } else if (disabledNote) {
        disabledNote.remove();
        disabledNote = null;
      }
    }
    if (reactionSelect) reactionSelect.addEventListener('change', apply);
    apply();
  }

  function buildObjectList(ns, f, value, saveModule) {
    var wrap = el('div', 'field');
    var topLabel = el('label');
    topLabel.textContent = f.label;
    wrap.appendChild(topLabel);
    if (f.help) {
      var topHelp = el('div', 'help');
      topHelp.textContent = f.help;
      wrap.appendChild(topHelp);
    }

    var list = el('div', 'object-list');
    wrap.appendChild(list);

    var rows = [];
    var items = Array.isArray(value) ? value.slice() : [];
    var expandedRowKeys = new Set();

    function rowKey(item, index) {
      return item.id && String(item.id).trim() ? String(item.id).trim() : ('__idx__' + index);
    }

    function isRowCollapsed(item, index) {
      if (!f.collapsible) return false;
      if (!item.id || !String(item.id).trim()) return false;
      return !expandedRowKeys.has(rowKey(item, index));
    }

    function cardTitle(row) {
      return row.openButtonLabel || row.panelTitle || row.id || f.itemLabel || 'Item';
    }

    function renderRows() {
      list.innerHTML = '';
      rows = [];
      items.forEach(function (item, index) {
        var card = el('div', 'object-card');
        if (isRowCollapsed(item, index)) card.classList.add('collapsed');

        var head = el('div', 'object-card-head');
        if (f.collapsible) head.classList.add('object-card-head-toggle');

        var headLeft = el('div', 'object-card-head-left');
        if (f.collapsible) {
          var chevron = el('span', 'collapse-chevron');
          chevron.textContent = isRowCollapsed(item, index) ? '\\u25B6' : '\\u25BC';
          chevron.setAttribute('aria-hidden', 'true');
          headLeft.appendChild(chevron);
        }
        var title = el('h3');
        title.textContent = cardTitle(item);
        headLeft.appendChild(title);
        head.appendChild(headLeft);

        var badge = el('span', 'badge' + (item.published ? ' on' : ''));
        badge.textContent = item.published ? 'Published' : 'Unpublished';
        head.appendChild(badge);
        card.appendChild(head);

        var body = el('div', 'object-card-body');

        var subFields = [];
        (f.itemFields || []).forEach(function (sub) {
          var built = buildSubField(sub, item[sub.key]);
          body.appendChild(built.node);
          subFields.push({ key: sub.key, getValue: built.getValue, node: built.node });
        });

        syncEphemeralField(subFields, ns);

        function refreshHeadTitle() {
          title.textContent = cardTitle(liveRowValues(subFields, item, f));
        }
        subFields.forEach(function (sf) {
          if (sf.key !== 'panelTitle' && sf.key !== 'openButtonLabel') return;
          var input = sf.node.querySelector('input, textarea');
          if (input) input.addEventListener('input', refreshHeadTitle);
        });

        if (f.collapsible) {
          head.addEventListener('click', function () {
            var key = rowKey(item, index);
            if (card.classList.contains('collapsed')) {
              expandedRowKeys.add(key);
              card.classList.remove('collapsed');
              chevron.textContent = '\\u25BC';
            } else {
              expandedRowKeys.delete(key);
              card.classList.add('collapsed');
              chevron.textContent = '\\u25B6';
            }
          });
        }

        var cardActions = el('div', 'object-actions');

        if (f.publishable) {
          var pubBtn = el('button', 'secondary');
          pubBtn.type = 'button';
          pubBtn.textContent = 'Publish panel';
          var unpubBtn = el('button', 'secondary danger');
          unpubBtn.type = 'button';
          unpubBtn.textContent = 'Unpublish';
          unpubBtn.disabled = !item.published;

          function refreshPublishState() {
            var live = liveRowValues(subFields, item, f);
            pubBtn.disabled = !live.channelId;
            unpubBtn.disabled = !item.published;
          }
          refreshPublishState();

          subFields.forEach(function (sf) {
            if (sf.key !== 'channelId') return;
            var select = sf.node.querySelector('select');
            if (select) select.addEventListener('change', refreshPublishState);
          });

          pubBtn.addEventListener('click', async function () {
            pubBtn.disabled = true;
            try {
              if (!saveModule) throw new Error('Save is unavailable.');
              var values = await saveModule();
              var savedRows = values[f.key] || [];
              var live = liveRowValues(subFields, item, f);
              var rowId = live.id;
              var saved = savedRows.find(function (t) { return t.id === rowId; });
              if (!saved) saved = savedRows[index];
              if (!saved || !saved.id) throw new Error('Could not save panel. Try Save first.');
              if (!saved.channelId) throw new Error('Pick a channel before publishing.');

              Object.assign(item, saved);

              var res = await fetch('/api/modules/' + encodeURIComponent(ns) + '/publish/' + encodeURIComponent(saved.id), {
                method: 'POST',
                headers: csrfHeaders(),
              });
              if (!res.ok) {
                var err = await res.json().catch(function () { return {}; });
                throw new Error(err.error || ('HTTP ' + res.status));
              }
              item.published = true;
              renderRows();
            } catch (e) {
              alert('Publish failed: ' + e.message);
              refreshPublishState();
            }
          });

          unpubBtn.addEventListener('click', async function () {
            unpubBtn.disabled = true;
            try {
              var live = liveRowValues(subFields, item, f);
              if (!live.id) throw new Error('Save this panel before unpublishing.');
              var res = await fetch('/api/modules/' + encodeURIComponent(ns) + '/unpublish/' + encodeURIComponent(live.id), {
                method: 'POST',
                headers: csrfHeaders(),
              });
              if (!res.ok) {
                var err = await res.json().catch(function () { return {}; });
                throw new Error(err.error || ('HTTP ' + res.status));
              }
              item.published = false;
              renderRows();
            } catch (e) {
              alert('Unpublish failed: ' + e.message);
              refreshPublishState();
            }
          });

          cardActions.appendChild(pubBtn);
          cardActions.appendChild(unpubBtn);
        }

        var removeBtn = el('button', 'secondary danger');
        removeBtn.type = 'button';
        removeBtn.textContent = 'DELETE';
        removeBtn.addEventListener('click', function () {
          items.splice(index, 1);
          renderRows();
        });
        cardActions.appendChild(removeBtn);
        body.appendChild(cardActions);
        card.appendChild(body);

        rows.push({
          getValue: function () {
            return liveRowValues(subFields, item, f);
          }
        });

        list.appendChild(card);
      });
    }

    renderRows();

    var addBtn = el('button', 'secondary add-row');
    addBtn.type = 'button';
    addBtn.textContent = 'Add ' + (f.itemLabel || 'item').toLowerCase();
    addBtn.addEventListener('click', function () {
      if (ns === 'reaction-roles') {
        items.push({
          id: '', published: false, channelId: '', reactionType: 'button', toggleable: true,
          panelTitle: 'Pick your roles', panelDescription: '', ephemeralMessage: '', roleOptions: []
        });
      } else {
        items.push({
          id: '', published: false, openButtonLabel: 'Open ticket', panelTitle: 'Support',
          panelDescription: '', emoji: '', channelId: '', staffRoleIds: [], deniedRoleIds: [],
          roleDenied: 'You cannot open a ticket in this category.',
          ticketWelcome: 'Hi {mention}, describe your issue and staff will assist you.',
          closeButtonLabel: 'Close ticket', confirmClosePrompt: 'Close this ticket?',
          confirmCloseYes: 'Yes, close', confirmCloseNo: 'Cancel',
          ticketClosed: 'This ticket has been closed.',
          deleteButtonLabel: 'DELETE',
          confirmDeletePrompt: 'Delete this closed ticket permanently?',
          confirmDeleteYes: 'Yes, delete', confirmDeleteNo: 'Cancel',
          ticketDeleted: 'Ticket deleted.',
          alreadyOpen: 'You already have an open ticket in this category.',
          openSuccess: 'Your ticket was created: {thread}'
        });
      }
      renderRows();
    });
    wrap.appendChild(addBtn);

    return {
      node: wrap,
      getValue: function () {
        return rows.map(function (r) { return r.getValue(); });
      },
      applySavedValues: function (savedRows) {
        if (!Array.isArray(savedRows)) return;
        items.length = 0;
        savedRows.forEach(function (row) {
          items.push(Object.assign({}, row));
        });
        renderRows();
      }
    };
  }

  // Plain text/textarea input. Also used as the fallback for channel fields when
  // the channel list could not be loaded.
  function textFallback(wrap, f, value, channelFallback) {
    var input = f.type === 'textarea' ? el('textarea') : el('input');
    if (input.tagName === 'INPUT') input.type = 'text';
    var isMulti = f.type === 'channel-multi' || f.type === 'role-multi';
    input.value = isMulti ? (Array.isArray(value) ? value.join(', ') : '') : (value || '');
    wrap.appendChild(input);
    if (channelFallback) {
      var note = el('div', 'channel-note');
      var errMsg = channelsError || rolesError || 'Could not load list.';
      note.textContent = errMsg + ' Enter id(s) manually' + (isMulti ? ' (comma-separated).' : '.');
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

  // Renders the on/off switch for a module. Instant-apply: each change PUTs the
  // new state and updates the sidebar tab; on failure it reverts the checkbox.
  function buildSwitch(mod, tab) {
    var toggle = buildToggleSwitch(mod.enabled !== false);
    var label = toggle.node;
    var input = toggle.input;

    input.addEventListener('change', async function () {
      var on = input.checked;
      tab.classList.toggle('off', !on);
      label.classList.add('busy');
      input.disabled = true;
      try {
        var res = await fetch('/api/modules/' + encodeURIComponent(mod.namespace) + '/enabled', {
          method: 'PUT',
          headers: csrfHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ enabled: on }),
        });
        if (!res.ok) {
          var err = await res.json().catch(function () { return {}; });
          throw new Error(err.error || ('HTTP ' + res.status));
        }
      } catch (e) {
        toggle.setChecked(!on);
        tab.classList.toggle('off', on);
        alert('Could not change module state: ' + e.message);
      } finally {
        label.classList.remove('busy');
        input.disabled = false;
      }
    });

    return label;
  }

  function buildPanel(mod, tab) {
    var panel = el('section', 'panel');
    panel.dataset.ns = mod.namespace;
    var inner = el('div', 'module');
    var head = el('div', 'module-head');
    var h = el('h2');
    h.textContent = mod.title;
    head.appendChild(h);
    head.appendChild(buildSwitch(mod, tab));
    inner.appendChild(head);
    if (mod.description) {
      var d = el('p', 'desc');
      d.textContent = mod.description;
      inner.appendChild(d);
    }

    var fields = [];
    async function saveModule() {
      var payload = {};
      fields.forEach(function (fld) { payload[fld.key] = fld.getValue(); });
      var res = await fetch('/api/modules/' + encodeURIComponent(mod.namespace), {
        method: 'PUT',
        headers: csrfHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        var err = await res.json().catch(function () { return {}; });
        throw new Error(err.error || ('HTTP ' + res.status));
      }
      var body = await res.json();
      return body.values || payload;
    }

    mod.fields.forEach(function (f) {
      var built = buildField(mod.namespace, f, mod.values[f.key], saveModule);
      inner.appendChild(built.node);
      fields.push({ key: f.key, getValue: built.getValue, applySavedValues: built.applySavedValues });
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
      btn.disabled = true;
      status.className = 'status';
      status.textContent = 'Saving...';
      try {
        var values = await saveModule();
        fields.forEach(function (fld) {
          if (typeof fld.applySavedValues === 'function' && values[fld.key]) {
            fld.applySavedValues(values[fld.key]);
          }
        });
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
      var dot = el('span', 'tab-dot');
      var text = el('span', 'tab-text');
      text.textContent = mod.title;
      tab.appendChild(dot);
      tab.appendChild(text);
      if (mod.enabled === false) tab.classList.add('off');
      tab.addEventListener('click', function () { activate(i); });
      sidebar.appendChild(tab);
      tabs.push(tab);

      var panel = buildPanel(mod, tab);
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
    }).catch(function () { return null; }),
    fetch('/api/roles').then(function (r) {
      if (!r.ok) return null;
      return r.json();
    }).catch(function () { return null; })
  ])
    .then(function (results) {
      var mods = results[0];
      var chans = results[1];
      var roleList = results[2];
      if (Array.isArray(chans)) {
        channels = chans;
      } else {
        channelsError = 'Could not load channels.';
      }
      if (Array.isArray(roleList)) {
        roles = roleList;
      } else {
        rolesError = 'Could not load roles.';
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
