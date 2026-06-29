import { readFileSync } from 'node:fs';
import { moduleDataPath } from '../../core/texts.js';
import { writeJsonAtomic } from '../../core/jsonWrite.js';
import type { TicketTypeConfig, TicketsConfig } from './types.js';
import { CONFIG_DEFAULTS, NAMESPACE } from './types.js';

function readRawConfig(): TicketsConfig {
  const file = moduleDataPath(NAMESPACE, 'config.json');
  try {
    return { ...CONFIG_DEFAULTS, ...JSON.parse(readFileSync(file, 'utf8')) };
  } catch {
    return { ...CONFIG_DEFAULTS };
  }
}

/** Updates one ticket type in config.json and writes atomically. */
export async function updateTicketType(
  typeId: string,
  patch: Partial<TicketTypeConfig>
): Promise<TicketTypeConfig | undefined> {
  const current = readRawConfig();
  const index = current.ticketTypes.findIndex((t) => t.id === typeId);
  if (index === -1) return undefined;

  const updated = { ...current.ticketTypes[index], ...patch };
  const ticketTypes = current.ticketTypes.slice();
  ticketTypes[index] = updated;

  await writeJsonAtomic(moduleDataPath(NAMESPACE, 'config.json'), {
    ...current,
    ticketTypes,
  });

  return updated;
}

export function getTicketTypeConfig(typeId: string): TicketTypeConfig | undefined {
  return readRawConfig().ticketTypes.find((t) => t.id === typeId);
}
