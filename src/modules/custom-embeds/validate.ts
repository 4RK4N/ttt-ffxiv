import { parsePanelBaseFields } from '../../core/panelFields.js';
import type { ResolvedEmbedPanel } from './types.js';

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function validateEmbedPanel(panel: ResolvedEmbedPanel): void {
  if (!panel.panelDescription.trim()) {
    throw new Error('Embed description is required.');
  }

  const iconUrl = panel.authorIconUrl.trim();
  const authorName = panel.authorName.trim();

  if (iconUrl && !authorName) {
    throw new Error('Author name is required when an author icon URL is set.');
  }

  if (iconUrl && !isHttpUrl(iconUrl)) {
    throw new Error('Author icon URL must be a valid http or https URL.');
  }
}

export function validateEmbedPanelRow(
  configRow: Record<string, unknown>,
  textRow: Record<string, unknown>
): void {
  const base = parsePanelBaseFields(configRow, textRow);
  const panel: ResolvedEmbedPanel = {
    ...base,
    showTimestamp: configRow.showTimestamp === true,
    authorName: typeof textRow.authorName === 'string' ? textRow.authorName : '',
    authorIconUrl: typeof textRow.authorIconUrl === 'string' ? textRow.authorIconUrl : '',
    footer: typeof textRow.footer === 'string' ? textRow.footer : '',
  };
  validateEmbedPanel(panel);
}
