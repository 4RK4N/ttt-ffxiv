export const CLIENT_JS = `
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

  function formControl(node) {
    if (node.tagName === 'SELECT') node.classList.add('form-select');
    else if (node.tagName === 'TEXTAREA' || node.tagName === 'INPUT') node.classList.add('form-control');
    return node;
  }

  function channelLabel(ch) {
    return '#' + ch.name;
  }

  function roleLabel(role) {
    return role.name;
  }

  function slugify(text) {
    return (text || 'item').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 32) || 'item';
  }

  function buildRoleSelect(wrap, value) {
    if (rolesError) return textFallback(wrap, { type: 'text' }, value, true);
    var select = formControl(el('select'));
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
    var select = formControl(el('select'));
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
    var label = el('label', 'form-check form-switch');
    var input = el('input', 'form-check-input');
    input.type = 'checkbox';
    input.checked = on;
    var text = el('span', 'form-check-label');
    function reflect(isOn) {
      text.textContent = isOn ? 'On' : 'Off';
    }
    reflect(on);
    label.appendChild(input);
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
    var list = el('div', 'vstack gap-3');
    wrap.appendChild(list);
    var items = Array.isArray(value) ? value.slice() : [];
    var rows = [];

    function renderOptions() {
      list.innerHTML = '';
      rows = [];
      items.forEach(function (item, index) {
        var card = el('div', 'card');
        var cardBody = el('div', 'card-body');
        var subFields = [];
        (f.optionFields || []).forEach(function (sub) {
          var built = buildSubField(sub, item[sub.key]);
          cardBody.appendChild(built.node);
          subFields.push({ key: sub.key, getValue: built.getValue });
        });
        var removeBtn = el('button', 'btn btn-outline-danger mt-2');
        removeBtn.type = 'button';
        removeBtn.textContent = 'Remove';
        removeBtn.addEventListener('click', function () {
          items.splice(index, 1);
          renderOptions();
        });
        cardBody.appendChild(removeBtn);
        card.appendChild(cardBody);
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
    var addBtn = el('button', 'btn mt-2');
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
    var list = el('div', 'border rounded p-2 checklist-scroll');
    var boxes = [];
    items.forEach(function (item) {
      var row = el('label', 'form-check');
      var cb = el('input', 'form-check-input');
      cb.type = 'checkbox';
      cb.value = item.id;
      if (selected.indexOf(item.id) !== -1) cb.checked = true;
      boxes.push(cb);
      var span = el('span', 'form-check-label');
      span.textContent = labelFn(item);
      row.appendChild(cb);
      row.appendChild(span);
      list.appendChild(row);
    });
    selected.forEach(function (id) {
      if (items.some(function (item) { return item.id === id; })) return;
      var row = el('label', 'form-check');
      var cb = el('input', 'form-check-input');
      cb.type = 'checkbox';
      cb.value = id;
      cb.checked = true;
      boxes.push(cb);
      var span = el('span', 'form-check-label');
      span.textContent = id + ' (not found)';
      row.appendChild(cb);
      row.appendChild(span);
      list.appendChild(row);
    });
    if (!items.length) {
      var empty = el('div', 'form-text text-secondary');
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

    var wrap = el('div', 'mb-3 field');
    var label = el('label', 'form-label');
    label.textContent = f.label;
    wrap.appendChild(label);
    if (f.help) {
      var help = el('div', 'form-text text-secondary');
      help.textContent = f.help;
      wrap.appendChild(help);
    }

    if (f.type === 'channel') {
      if (channelsError) return textFallback(wrap, f, value, true);
      var select = formControl(el('select'));
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
    var wrap = el('div', 'mb-3 field');
    var label = el('label', 'form-label');
    label.textContent = f.label;
    wrap.appendChild(label);
    if (f.help) {
      var help = el('div', 'form-text text-secondary');
      help.textContent = f.help;
      wrap.appendChild(help);
    }

    if (f.type === 'channel') {
      if (channelsError) return textFallback(wrap, f, value, true);
      var select = formControl(el('select'));
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

  function isFieldVisible(def, subFields) {
    if (!def.visibleWhen) return true;
    for (var watchKey in def.visibleWhen) {
      var allowed = def.visibleWhen[watchKey];
      var watchSf = subFields.find(function (s) { return s.key === watchKey; });
      var current = watchSf ? watchSf.getValue() : '';
      if (allowed.indexOf(current) === -1) return false;
    }
    return true;
  }

  function syncConditionalFields(subFields) {
    subFields.forEach(function (sf) {
      if (!sf.def || !sf.def.visibleWhen) return;

      var def = sf.def;
      var hiddenNote = null;

      function clearFieldValue() {
        var input = sf.node.querySelector('input[type="text"], textarea');
        if (input) input.value = '';
        var cb = sf.node.querySelector('input[type="checkbox"]');
        if (cb) cb.checked = false;
      }

      function apply() {
        var visible = isFieldVisible(def, subFields);
        sf.node.classList.toggle('disabled', !visible);
        if (!visible) {
          if (!hiddenNote) {
            hiddenNote = el('div', 'form-text text-secondary');
            hiddenNote.textContent = 'Not available for this configuration.';
            sf.node.appendChild(hiddenNote);
          }
          if (def.clearWhenHidden) clearFieldValue();
        } else if (hiddenNote) {
          hiddenNote.remove();
          hiddenNote = null;
        }
      }

      Object.keys(def.visibleWhen).forEach(function (watchKey) {
        var watchSf = subFields.find(function (s) { return s.key === watchKey; });
        if (!watchSf) return;
        var select = watchSf.node.querySelector('select');
        if (select) select.addEventListener('change', apply);
      });

      if (def.clearWhenHidden) {
        var origGet = sf.getValue;
        sf.getValue = function () {
          if (!isFieldVisible(def, subFields)) return '';
          return origGet();
        };
      }

      apply();
    });
  }

  function buildObjectList(ns, f, value, saveModule) {
    var wrap = el('div', 'mb-3 field');
    var topLabel = el('label', 'form-label');
    topLabel.textContent = f.label;
    wrap.appendChild(topLabel);
    if (f.help) {
      var topHelp = el('div', 'form-text text-secondary');
      topHelp.textContent = f.help;
      wrap.appendChild(topHelp);
    }

    var list = el('div', 'vstack gap-3');
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
        var card = el('div', 'card');
        if (isRowCollapsed(item, index)) card.classList.add('is-collapsed');

        var head = el('div', 'card-header d-flex align-items-center justify-content-between gap-2');
        if (f.collapsible) head.classList.add('is-toggle');

        var headLeft = el('div', 'd-flex align-items-center gap-2 flex-fill overflow-hidden');
        if (f.collapsible) {
          var chevron = el('span', 'text-secondary');
          chevron.textContent = isRowCollapsed(item, index) ? '\\u25B6' : '\\u25BC';
          chevron.setAttribute('aria-hidden', 'true');
          headLeft.appendChild(chevron);
        }
        var title = el('h3', 'card-title mb-0 text-truncate');
        title.textContent = cardTitle(item);
        headLeft.appendChild(title);
        head.appendChild(headLeft);

        var badge = el('span', 'badge ' + (item.published ? 'bg-success' : 'bg-secondary-lt'));
        badge.textContent = item.published ? 'Published' : 'Unpublished';
        head.appendChild(badge);
        card.appendChild(head);

        var body = el('div', 'card-body');

        var subFields = [];
        (f.itemFields || []).forEach(function (sub) {
          var built = buildSubField(sub, item[sub.key]);
          body.appendChild(built.node);
          subFields.push({ key: sub.key, getValue: built.getValue, node: built.node, def: sub });
        });

        syncConditionalFields(subFields);

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
            if (card.classList.contains('is-collapsed')) {
              expandedRowKeys.add(key);
              card.classList.remove('is-collapsed');
              chevron.textContent = '\\u25BC';
            } else {
              expandedRowKeys.delete(key);
              card.classList.add('is-collapsed');
              chevron.textContent = '\\u25B6';
            }
          });
        }

        var cardActions = el('div', 'd-flex flex-wrap gap-2 mt-3');

        if (f.publishable) {
          var pubBtn = el('button', 'btn btn-success');
          pubBtn.type = 'button';
          pubBtn.textContent = 'Publish panel';
          var unpubBtn = el('button', 'btn');
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

        var removeBtn = el('button', 'btn btn-outline-danger');
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

    var addBtn = el('button', 'btn mt-2');
    addBtn.type = 'button';
    addBtn.textContent = 'Add ' + (f.itemLabel || 'item').toLowerCase();
    addBtn.addEventListener('click', function () {
      var defaults = f.defaultItem || { id: '', published: false };
      items.push(JSON.parse(JSON.stringify(defaults)));
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
    var input = f.type === 'textarea' ? formControl(el('textarea')) : formControl(el('input'));
    if (input.tagName === 'INPUT') input.type = 'text';
    var isMulti = f.type === 'channel-multi' || f.type === 'role-multi';
    input.value = isMulti ? (Array.isArray(value) ? value.join(', ') : '') : (value || '');
    wrap.appendChild(input);
    if (channelFallback) {
      var note = el('div', 'form-text text-danger');
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
      tab.classList.toggle('text-secondary', !on);
      var dot = tab.querySelector('.status-dot');
      if (dot) {
        dot.classList.toggle('status-green', on);
        dot.classList.toggle('status-muted', !on);
      }
      label.classList.add('opacity-50');
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
        tab.classList.toggle('text-secondary', on);
        var dot = tab.querySelector('.status-dot');
        if (dot) {
          dot.classList.toggle('status-green', !on);
          dot.classList.toggle('status-muted', on);
        }
        alert('Could not change module state: ' + e.message);
      } finally {
        label.classList.remove('opacity-50');
        input.disabled = false;
      }
    });

    return label;
  }

  function buildPanel(mod, tab) {
    var panel = el('section', 'module-panel d-none');
    panel.dataset.ns = mod.namespace;
    var inner = el('div');
    var head = el('div', 'd-flex justify-content-between align-items-start mb-3');
    var h = el('h2', 'mb-0');
    h.textContent = mod.title;
    head.appendChild(h);
    head.appendChild(buildSwitch(mod, tab));
    inner.appendChild(head);
    if (mod.description) {
      var d = el('p', 'text-secondary mb-3');
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

    var actions = el('div', 'd-flex align-items-center gap-2 mt-3');
    var btn = el('button', 'btn btn-primary');
    btn.textContent = 'Save';
    var status = el('span', 'text-secondary');
    actions.appendChild(btn);
    actions.appendChild(status);
    inner.appendChild(actions);
    panel.appendChild(inner);

    btn.addEventListener('click', async function () {
      btn.disabled = true;
      status.className = 'text-secondary';
      status.textContent = 'Saving...';
      try {
        var values = await saveModule();
        fields.forEach(function (fld) {
          if (typeof fld.applySavedValues === 'function' && values[fld.key]) {
            fld.applySavedValues(values[fld.key]);
          }
        });
        status.className = 'text-success';
        status.textContent = 'Saved';
      } catch (e) {
        status.className = 'text-danger';
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
      var e = el('div', 'text-secondary text-center py-5');
      e.textContent = 'No editable modules found.';
      app.appendChild(e);
      return;
    }

    var layout = el('div', 'd-flex flex-fill w-100');
    var sidebar = el('aside', 'navbar navbar-vertical navbar-expand-lg');
    var sidebarInner = el('div', 'container-fluid');
    var nav = el('div', 'navbar-nav pt-lg-3');
    var navTitle = el('div', 'text-secondary text-uppercase small px-3 py-2');
    navTitle.textContent = 'Modules';
    nav.appendChild(navTitle);
    var content = el('div', 'page-body');
    var container = el('div', 'container-xl py-4');

    var tabs = [];
    var panels = [];

    function activate(i) {
      tabs.forEach(function (t, j) {
        t.classList.toggle('active', i === j);
      });
      panels.forEach(function (p, j) {
        p.classList.toggle('d-none', i !== j);
      });
    }

    mods.forEach(function (mod, i) {
      var tab = el('button', 'nav-link w-100 text-start');
      tab.type = 'button';
      var dot = el('span', 'status-dot ' + (mod.enabled === false ? 'status-muted' : 'status-green'));
      var text = el('span');
      text.textContent = mod.title;
      tab.appendChild(dot);
      tab.appendChild(text);
      if (mod.enabled === false) tab.classList.add('text-secondary');
      tab.addEventListener('click', function () { activate(i); });
      nav.appendChild(tab);
      tabs.push(tab);

      var panel = buildPanel(mod, tab);
      container.appendChild(panel);
      panels.push(panel);
    });

    sidebarInner.appendChild(nav);
    sidebar.appendChild(sidebarInner);
    content.appendChild(container);
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
      var d = el('div', 'text-secondary text-center py-5');
      d.textContent = 'Failed to load modules: ' + e.message;
      app.appendChild(d);
    });
})();
`;
