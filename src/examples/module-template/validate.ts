/**
 * Web editor row validation (panel modules only).
 *
 * Called from src/web/store.ts when saving object-list fields. Use parsePanelBaseFields
 * for shared id/published/channelId/panelTitle/panelDescription coercion.
 */
import { parsePanelBaseFields } from '../../core/panelFields.js';

export function validateExamplePanelRow(
  configRow: Record<string, unknown>,
  textRow: Record<string, unknown>
): void {
  const base = parsePanelBaseFields(configRow, textRow);
  if (!base.panelDescription.trim()) {
    throw new Error('Panel description is required.');
  }
}
