import type { WebPlugin, WebPluginField, WebPluginSubField } from '../../plugin-types.js';
import { isFieldVisible } from '../../editor-logic.js';

type FormBody = Record<string, string | string[] | File>;

function setNestedArray(obj: Record<string, unknown>, path: string, value: string): void {
  const segments = path.split('.');
  let cur: Record<string, unknown> | unknown[] = obj;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const indexMatch = seg.match(/^(.+)\[(\d+)\]$/);
    const isLast = i === segments.length - 1;

    if (indexMatch) {
      const [, key, idxStr] = indexMatch;
      const idx = Number(idxStr);
      const parent = cur as Record<string, unknown>;
      if (!Array.isArray(parent[key])) parent[key] = [];
      const arr = parent[key] as unknown[];
      if (isLast) {
        if (!Array.isArray(arr[idx])) arr[idx] = [];
        (arr[idx] as unknown[]).push(value);
        return;
      }
      if (arr[idx] == null || typeof arr[idx] !== 'object') arr[idx] = {};
      cur = arr[idx] as Record<string, unknown>;
      continue;
    }

    if (isLast) {
      const parent = cur as Record<string, unknown>;
      if (!Array.isArray(parent[seg])) parent[seg] = [];
      (parent[seg] as unknown[]).push(value);
      return;
    }

    const parent = cur as Record<string, unknown>;
    if (parent[seg] == null || typeof parent[seg] !== 'object') parent[seg] = {};
    cur = parent[seg] as Record<string, unknown>;
  }
}

function appendFormValue(root: Record<string, unknown>, key: string, raw: string): void {
  if (key.endsWith('[]')) {
    setNestedArray(root, key.slice(0, -2), raw);
    return;
  }

  const parts = key.match(/[^[\].]+|\[\d+\]/g);
  if (!parts?.length) return;

  let cur: Record<string, unknown> | unknown[] = root;
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const isLast = i === parts.length - 1;
    const indexMatch = part.match(/^\[(\d+)\]$/);

    if (indexMatch) {
      const idx = Number(indexMatch[1]);
      if (!Array.isArray(cur)) return;
      if (isLast) {
        cur[idx] = raw;
      } else {
        if (cur[idx] == null || typeof cur[idx] !== 'object') {
          cur[idx] = /^\[\d+\]$/.test(parts[i + 1] ?? '') ? [] : {};
        }
        cur = cur[idx] as Record<string, unknown> | unknown[];
      }
      continue;
    }

    if (isLast) {
      (cur as Record<string, unknown>)[part] = raw;
    } else {
      const nextIsIndex = /^\[\d+\]$/.test(parts[i + 1] ?? '');
      const parent = cur as Record<string, unknown>;
      if (parent[part] == null || typeof parent[part] !== 'object') {
        parent[part] = nextIsIndex ? [] : {};
      }
      cur = parent[part] as Record<string, unknown> | unknown[];
    }
  }
}

/** Parse bracket keys like `panels[0].channelId` into nested objects/arrays. */
export function parseBracketForm(body: FormBody): Record<string, unknown> {
  const root: Record<string, unknown> = {};

  for (const [key, raw] of Object.entries(body)) {
    if (raw instanceof File) continue;
    if (Array.isArray(raw)) {
      for (const v of raw) {
        if (typeof v === 'string') appendFormValue(root, key, v);
      }
      continue;
    }
    if (typeof raw !== 'string') continue;
    if (key === '_csrf') continue;
    appendFormValue(root, key, raw);
  }

  return root;
}

function parseScalarField(
  f: WebPluginField | WebPluginSubField,
  tree: Record<string, unknown>,
): unknown {
  const raw = tree[f.key];

  if (f.type === 'boolean') {
    if (raw === undefined || raw === '' || raw === 'false') return false;
    return raw === 'true' || raw === 'on' || raw === true;
  }
  if (f.type === 'channel-multi' || f.type === 'role-multi') {
    if (Array.isArray(raw)) return raw.filter((v): v is string => typeof v === 'string');
    if (typeof raw === 'string' && raw !== '') return [raw];
    return [];
  }
  if (f.type === 'option-list') {
    return parseOptionList(f as WebPluginSubField, raw);
  }
  if (typeof raw === 'string') return raw;
  return '';
}

function parseOptionList(f: WebPluginSubField, raw: unknown): Record<string, unknown>[] {
  if (!Array.isArray(raw)) return [];
  const rows: Record<string, unknown>[] = [];
  for (const entry of raw) {
    if (typeof entry !== 'object' || entry === null) continue;
    const row = entry as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    if (typeof row.id === 'string') out.id = row.id;
    for (const sub of f.optionFields ?? []) {
      out[sub.key] = parseScalarField(sub, row);
    }
    rows.push(out);
  }
  return rows;
}

function parseObjectListRow(field: WebPluginField, raw: unknown): Record<string, unknown> {
  if (typeof raw !== 'object' || raw === null) return {};
  const row = raw as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  if (typeof row.id === 'string') out.id = row.id;
  if (row.published === true || row.published === 'true') out.published = true;

  const subReaders = (field.itemFields ?? []).map((sub) => ({
    key: sub.key,
    getValue: () => parseScalarField(sub, row),
    def: sub,
  }));

  for (const sub of field.itemFields ?? []) {
    const visible = isFieldVisible(sub, subReaders);
    if (!visible && sub.clearWhenHidden) {
      if (sub.type === 'boolean') out[sub.key] = false;
      else if (sub.type === 'channel-multi' || sub.type === 'role-multi') out[sub.key] = [];
      else if (sub.type === 'option-list') out[sub.key] = [];
      else out[sub.key] = '';
    } else {
      out[sub.key] = parseScalarField(sub, row);
    }
  }
  return out;
}

/** Convert HTMX form body to the JSON shape expected by writeValues. */
export function formBodyToValues(
  plugin: WebPlugin,
  body: FormBody,
): Record<string, unknown> {
  const tree = parseBracketForm(body);
  const out: Record<string, unknown> = {};

  for (const f of plugin.fields) {
    if (f.type === 'object-list') {
      const raw = tree[f.key];
      if (!Array.isArray(raw)) {
        out[f.key] = [];
        continue;
      }
      out[f.key] = raw.map((row) => parseObjectListRow(f, row));
      continue;
    }
    out[f.key] = parseScalarField(f, tree);
  }

  return out;
}
