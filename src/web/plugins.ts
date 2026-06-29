import { readFileSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Resolve the modules directory the same way the bot's moduleLoader does, so the
// web editor discovers modules from the same place (src/ under tsx, dist/ in prod).
const __dirname = dirname(fileURLToPath(import.meta.url));
const MODULES_DIR = join(__dirname, '..', 'modules');

export type WebFieldType = 'text' | 'textarea' | 'channel' | 'channel-multi';

/** Which data file a field is stored in. */
export type WebFieldStore = 'texts' | 'config';

export interface WebPluginField {
  /** JSON key in the module's data file (texts.json or config.json). */
  key: string;
  /** Human-readable label shown in the editor. */
  label: string;
  /** Input style; defaults to "text". */
  type: WebFieldType;
  /** Which data file this field is read from / written to; defaults to "texts". */
  store: WebFieldStore;
  /** Optional hint (e.g. available tokens) shown under the field. */
  help?: string;
}

export interface WebPlugin {
  /** Data folder / getTexts namespace. Derived from the module folder name. */
  namespace: string;
  title: string;
  description?: string;
  fields: WebPluginField[];
}

const VALID_TYPES: WebFieldType[] = ['text', 'textarea', 'channel', 'channel-multi'];
const VALID_STORES: WebFieldStore[] = ['texts', 'config'];

/**
 * Validates a parsed web-plugin.json into a WebPlugin, or returns null (with a
 * warning) if it is malformed. Keeps the editor resilient to a bad manifest.
 */
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

    fields.push({
      key: f.key,
      label: typeof f.label === 'string' && f.label.trim() !== '' ? f.label : f.key,
      type,
      store,
      help: typeof f.help === 'string' ? f.help : undefined,
    });
  }

  if (fields.length === 0) {
    console.warn(`[web/plugins] "${namespace}/web-plugin.json" has no valid fields; skipping.`);
    return null;
  }

  return { namespace, title, description, fields };
}

/**
 * Scans every module folder for a web-plugin.json manifest and returns the valid
 * ones. The namespace (data folder) is the module folder name. Modules without a
 * manifest are simply not editable in the web UI.
 */
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

  // Stable, predictable order in the UI.
  plugins.sort((a, b) => a.title.localeCompare(b.title));
  return plugins;
}
