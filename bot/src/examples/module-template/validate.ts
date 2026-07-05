/**
 * Panel row validation — copy to `shared/modules/<name>/validate.ts` when creating a
 * panel module. Wire `validateExamplePanelRow` in `web-admin/src/store.ts` (see README).
 *
 * Not compiled in-place (see bot/tsconfig.json exclude) — imports assume destination
 * under shared/modules/<name>/.
 */
import { parsePanelBaseFields } from "../../core/panelFields.js";

interface ExamplePanelLike {
  panelTitle: string;
  panelDescription: string;
}

export function validateExamplePanel(panel: ExamplePanelLike): void {
  if (!panel.panelTitle.trim()) {
    throw new Error("Panel title is required.");
  }
  if (!panel.panelDescription.trim()) {
    throw new Error("Panel description is required.");
  }
}

export function validateExamplePanelRow(
  configRow: Record<string, unknown>,
  textRow: Record<string, unknown>,
): void {
  const base = parsePanelBaseFields(configRow, textRow);
  validateExamplePanel(base);
}

// Richer list validation: see shared/modules/tickets/validate.ts
