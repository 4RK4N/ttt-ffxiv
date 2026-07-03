export interface PanelBaseFields {
  id: string;
  published: boolean;
  panelMessageId: string;
  channelId: string;
  panelTitle: string;
  panelDescription: string;
}

export function parsePanelBaseFields(
  configRow: Record<string, unknown>,
  textRow: Record<string, unknown>
): PanelBaseFields {
  return {
    id: typeof configRow.id === 'string' ? configRow.id : '',
    published: configRow.published === true,
    panelMessageId: typeof configRow.panelMessageId === 'string' ? configRow.panelMessageId : '',
    channelId: typeof configRow.channelId === 'string' ? configRow.channelId : '',
    panelTitle: typeof textRow.panelTitle === 'string' ? textRow.panelTitle : '',
    panelDescription: typeof textRow.panelDescription === 'string' ? textRow.panelDescription : '',
  };
}
