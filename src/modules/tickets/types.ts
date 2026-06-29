import { getConfig, getTexts } from '../../core/texts.js';

export const NAMESPACE = 'tickets';

export interface TicketTypeConfig {
  id: string;
  published: boolean;
  emoji: string;
  channelId: string;
  panelMessageId: string;
  staffRoleIds: string[];
}

export interface TicketTypeTexts {
  openButtonLabel: string;
  panelTitle: string;
  panelDescription: string;
  ticketWelcome: string;
  closeButtonLabel: string;
  confirmClosePrompt: string;
  confirmCloseYes: string;
  confirmCloseNo: string;
  ticketClosed: string;
  alreadyOpen: string;
  openSuccess: string;
}

export interface ResolvedTicketType extends TicketTypeConfig, TicketTypeTexts { }

export interface TicketsConfig {
  enabled?: boolean;
  ticketTypes: TicketTypeConfig[];
}

export interface TicketsTexts {
  disabled: string;
  noPermission: string;
  categoryUnpublished: string;
  types: Record<string, TicketTypeTexts>;
}

export const DEFAULT_TYPE_TEXTS: TicketTypeTexts = {
  openButtonLabel: 'Open ticket',
  panelTitle: 'Support',
  panelDescription: 'Click the button below to open a private ticket.',
  ticketWelcome: 'Hi {mention}, describe your issue and staff will assist you.',
  closeButtonLabel: 'Close ticket',
  confirmClosePrompt: 'Are you sure you want to close this ticket?',
  confirmCloseYes: 'Yes, close',
  confirmCloseNo: 'Cancel',
  ticketClosed: 'This ticket has been closed.',
  alreadyOpen: 'You already have an open ticket in this category.',
  openSuccess: 'Your ticket was created: {thread}',
};

export const TEXT_DEFAULTS: TicketsTexts = {
  disabled: 'Tickets are currently disabled.',
  noPermission: "You don't have permission to close this ticket.",
  categoryUnpublished: 'This ticket category is not available right now.',
  types: {},
};

export const CONFIG_DEFAULTS: TicketsConfig = {
  enabled: true,
  ticketTypes: [],
};

export function config(): TicketsConfig {
  return getConfig(NAMESPACE, CONFIG_DEFAULTS);
}

export function texts(): TicketsTexts {
  return getTexts(NAMESPACE, TEXT_DEFAULTS);
}

export function resolveTicketType(id: string): ResolvedTicketType | undefined {
  const row = config().ticketTypes.find((t) => t.id === id);
  if (!row) return undefined;
  const copy = texts().types[id] ?? DEFAULT_TYPE_TEXTS;
  return { ...row, ...copy };
}
