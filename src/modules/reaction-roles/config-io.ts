import { readFileSync } from 'node:fs';
import { moduleDataPath } from '../../core/texts.js';
import { writeJsonAtomic } from '../../core/jsonWrite.js';
import type { RolePanelConfig, ReactionRolesConfig } from './types.js';
import { CONFIG_DEFAULTS, NAMESPACE } from './types.js';

function readRawConfig(): ReactionRolesConfig {
  const file = moduleDataPath(NAMESPACE, 'config.json');
  try {
    return { ...CONFIG_DEFAULTS, ...JSON.parse(readFileSync(file, 'utf8')) };
  } catch {
    return { ...CONFIG_DEFAULTS };
  }
}

/** Updates one panel in config.json and writes atomically (mtime bump refreshes getConfig()). */
export async function updatePanel(
  panelId: string,
  patch: Partial<RolePanelConfig>
): Promise<RolePanelConfig | undefined> {
  const current = readRawConfig();
  const index = current.panels.findIndex((p) => p.id === panelId);
  if (index === -1) return undefined;

  const updated = { ...current.panels[index], ...patch };
  const panels = current.panels.slice();
  panels[index] = updated;

  await writeJsonAtomic(moduleDataPath(NAMESPACE, 'config.json'), {
    ...current,
    panels,
  });

  return updated;
}

export function getPanelConfig(panelId: string): RolePanelConfig | undefined {
  return readRawConfig().panels.find((p) => p.id === panelId);
}
