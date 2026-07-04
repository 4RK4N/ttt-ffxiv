export const STYLES = `
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
