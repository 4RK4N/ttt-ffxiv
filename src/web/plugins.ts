import { readFileSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MODULES_DIR = join(__dirname, '..', 'modules');

export type WebFieldType =
  | 'text'
  | 'textarea'
  | 'channel'
  | 'channel-multi'
  | 'role'
  | 'role-multi'
  | 'boolean'
  | 'select'
  | 'option-list'
  | 'object-list';

export type WebFieldStore = 'texts' | 'config';

export interface WebPluginSelectOption {
  value: string;
  label: string;
}

export interface WebPluginSubField {
  key: string;
  label: string;
  type: Exclude<WebFieldType, 'object-list'>;
  store?: WebFieldStore;
  help?: string;
  options?: WebPluginSelectOption[];
  optionFields?: WebPluginSubField[];
}

export interface WebPluginField {
  key: string;
  label: string;
  type: WebFieldType;
  store: WebFieldStore;
  help?: string;
  itemLabel?: string;
  /** When true, object-list cards get Publish/Unpublish actions. */
  publishable?: boolean;
  /** When true, object-list cards collapse to title + published badge. */
  collapsible?: boolean;
  /** Nested map key in texts.json for object-list text fields (e.g. "types"). */
  textsKey?: string;
  itemFields?: WebPluginSubField[];
}

export interface WebPlugin {
  namespace: string;
  title: string;
  description?: string;
  fields: WebPluginField[];
}

const VALID_SCALAR_TYPES: WebPluginSubField['type'][] = [
  'text',
  'textarea',
  'channel',
  'channel-multi',
  'role',
  'role-multi',
  'boolean',
  'select',
  'option-list',
];
const VALID_TYPES: WebFieldType[] = [...VALID_SCALAR_TYPES, 'object-list'];
const VALID_STORES: WebFieldStore[] = ['texts', 'config'];

function parseSelectOptions(raw: unknown): WebPluginSelectOption[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const options: WebPluginSelectOption[] = [];
  for (const entry of raw) {
    if (typeof entry !== 'object' || entry === null) continue;
    const o = entry as Record<string, unknown>;
    if (typeof o.value !== 'string' || typeof o.label !== 'string') continue;
    options.push({ value: o.value, label: o.label });
  }
  return options.length > 0 ? options : undefined;
}

function parseSubField(entry: unknown): WebPluginSubField | null {
  if (typeof entry !== 'object' || entry === null) return null;
  const f = entry as Record<string, unknown>;
  if (typeof f.key !== 'string' || f.key.trim() === '') return null;

  const type =
    typeof f.type === 'string' && (VALID_SCALAR_TYPES as string[]).includes(f.type)
      ? (f.type as WebPluginSubField['type'])
      : 'text';

  const store =
    typeof f.store === 'string' && (VALID_STORES as string[]).includes(f.store)
      ? (f.store as WebFieldStore)
      : 'config';

  const optionFields: WebPluginSubField[] = [];
  if (type === 'option-list' && Array.isArray(f.optionFields)) {
    for (const sub of f.optionFields) {
      const parsed = parseSubField(sub);
      if (parsed) optionFields.push(parsed);
    }
  }

  return {
    key: f.key,
    label: typeof f.label === 'string' && f.label.trim() !== '' ? f.label : f.key,
    type,
    store,
    help: typeof f.help === 'string' ? f.help : undefined,
    options: parseSelectOptions(f.options),
    optionFields: optionFields.length > 0 ? optionFields : undefined,
  };
}

function parsePlugin(namespace: string, raw: unknown): WebPlugin | null {
  if (typeof raw !== 'object' || raw === null) {
    console.warn(`[web/plugins] "${namespace}/web-plugin.json" is not an object; skipping.`);
    return null;
  }

  const obj = raw as Record<string, unknown>;
  const title = typeof obj.title === 'string' && obj.title.trim() !== '' ? obj.title : namespace;
  const description = typeof obj.description === 'string' ? obj.description : undefined;

  if (!Array.isArray(obj.fields)) {
    console.warn(`[web/plugins] "${namespace}/web-plugin.json" has no fields array; skipping.`);
    return null;
  }

  const fields: WebPluginField[] = [];
  for (const entry of obj.fields) {
    if (typeof entry !== 'object' || entry === null) continue;
    const f = entry as Record<string, unknown>;

    if (typeof f.key !== 'string' || f.key.trim() === '') {
      console.warn(`[web/plugins] "${namespace}" has a field without a valid "key"; skipping field.`);
      continue;
    }

    const type: WebFieldType =
      typeof f.type === 'string' && (VALID_TYPES as string[]).includes(f.type)
        ? (f.type as WebFieldType)
        : 'text';

    const store: WebFieldStore =
      typeof f.store === 'string' && (VALID_STORES as string[]).includes(f.store)
        ? (f.store as WebFieldStore)
        : 'texts';

    const itemFields: WebPluginSubField[] = [];
    if (type === 'object-list' && Array.isArray(f.itemFields)) {
      for (const sub of f.itemFields) {
        const parsed = parseSubField(sub);
        if (parsed) itemFields.push(parsed);
      }
    }

    fields.push({
      key: f.key,
      label: typeof f.label === 'string' && f.label.trim() !== '' ? f.label : f.key,
      type,
      store,
      help: typeof f.help === 'string' ? f.help : undefined,
      itemLabel: typeof f.itemLabel === 'string' ? f.itemLabel : 'Item',
      publishable: f.publishable === true,
      collapsible: f.collapsible === true,
      textsKey: typeof f.textsKey === 'string' ? f.textsKey : undefined,
      itemFields: itemFields.length > 0 ? itemFields : undefined,
    });
  }

  if (fields.length === 0) {
    console.warn(`[web/plugins] "${namespace}/web-plugin.json" has no valid fields; skipping.`);
    return null;
  }

  return { namespace, title, description, fields };
}

export async function loadWebPlugins(): Promise<WebPlugin[]> {
  if (!existsSync(MODULES_DIR)) {
    console.warn(`[web/plugins] Modules directory not found at ${MODULES_DIR}.`);
    return [];
  }

  const plugins: WebPlugin[] = [];
  const entries = await readdir(MODULES_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const manifestPath = join(MODULES_DIR, entry.name, 'web-plugin.json');
    if (!existsSync(manifestPath)) continue;

    try {
      const parsed = JSON.parse(readFileSync(manifestPath, 'utf8'));
      const plugin = parsePlugin(entry.name, parsed);
      if (plugin) {
        plugins.push(plugin);
        console.log(`[web/plugins] Loaded web plugin "${plugin.title}" (${entry.name}).`);
      }
    } catch (err) {
      console.warn(`[web/plugins] Failed to read "${manifestPath}"; skipping.`, err);
    }
  }

  plugins.sort((a, b) => a.title.localeCompare(b.title));
  return plugins;
}

export function isMultiSubField(field: WebPluginSubField): boolean {
  return field.type === 'channel-multi' || field.type === 'role-multi';
}

export function isObjectListField(field: WebPluginField): boolean {
  return field.type === 'object-list';
}

export function isMultiField(field: WebPluginField): boolean {
  return field.type === 'channel-multi' || field.type === 'role-multi';
}

export function isOptionListSubField(field: WebPluginSubField): boolean {
  return field.type === 'option-list';
}

export function isBooleanSubField(field: WebPluginSubField): boolean {
  return field.type === 'boolean';
}
