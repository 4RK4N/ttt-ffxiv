import type { WebPlugin, WebPluginField } from '../../plugin-types.js';
import { formBodyToValues } from './form-parse.js';

type FormBody = Record<string, string | File>;

export function valuesFromForm(plugin: WebPlugin, body: FormBody): Record<string, unknown> {
  return formBodyToValues(plugin, body);
}

export function getObjectListItems(
  plugin: WebPlugin,
  body: FormBody,
  fieldKey: string,
): Record<string, unknown>[] {
  const values = formBodyToValues(plugin, body);
  const raw = values[fieldKey];
  return Array.isArray(raw) ? (raw as Record<string, unknown>[]) : [];
}

export function findObjectListField(plugin: WebPlugin, fieldKey: string): WebPluginField | null {
  const field = plugin.fields.find((f) => f.key === fieldKey);
  if (!field || field.type !== 'object-list') return null;
  return field;
}

export function toggleExpanded(expanded: string[], key: string): string[] {
  const set = new Set(expanded);
  if (set.has(key)) set.delete(key);
  else set.add(key);
  return [...set];
}

function rowKey(item: Record<string, unknown>, index: number): string {
  const id = item.id;
  return id && String(id).trim() ? String(id).trim() : `__idx__${index}`;
}

export function rowKeyForItem(item: Record<string, unknown>, index: number): string {
  return rowKey(item, index);
}

export function mergeRowFromForm(
  plugin: WebPlugin,
  body: FormBody,
  fieldKey: string,
  rowIndex: number,
): Record<string, unknown> {
  const items = getObjectListItems(plugin, body, fieldKey);
  return items[rowIndex] ?? {};
}

export function getOptionListItems(
  row: Record<string, unknown>,
  optionKey: string,
): Record<string, unknown>[] {
  const raw = row[optionKey];
  return Array.isArray(raw) ? (raw as Record<string, unknown>[]) : [];
}

export function defaultOptionItem(): Record<string, unknown> {
  return { id: '', roleId: '', emoji: '', label: '' };
}

export function defaultObjectItem(field: WebPluginField): Record<string, unknown> {
  return structuredClone(field.defaultItem ?? { id: '', published: false });
}
