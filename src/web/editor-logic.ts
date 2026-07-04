import { slugify } from '../core/strings.js';
import type { WebPluginField, WebPluginSubField, WebPluginVisibleWhen } from './plugin-types.js';

export interface SubFieldReader {
  key: string;
  getValue: () => unknown;
}

/** Collect live values from object-list row sub-fields. */
export function liveRowValues(
  subFields: SubFieldReader[],
  item: Record<string, unknown>,
  f?: Pick<WebPluginField, 'itemLabel'>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { id: item.id || '' };
  for (const sf of subFields) {
    out[sf.key] = sf.getValue();
  }
  if (!out.id) {
    out.id = slugify(
      String(out.openButtonLabel ?? out.panelTitle ?? f?.itemLabel ?? 'item'),
    );
  }
  return out;
}

/** Whether a sub-field should show given sibling values and visibleWhen rules. */
export function isFieldVisible(
  def: Pick<WebPluginSubField, 'visibleWhen'>,
  subFields: SubFieldReader[],
): boolean {
  if (!def.visibleWhen) return true;
  for (const watchKey of Object.keys(def.visibleWhen)) {
    const allowed = def.visibleWhen[watchKey as keyof WebPluginVisibleWhen];
    const watchSf = subFields.find((s) => s.key === watchKey);
    const current = watchSf ? String(watchSf.getValue() ?? '') : '';
    if (!allowed.includes(current)) return false;
  }
  return true;
}
