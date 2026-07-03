import { createModuleConfig } from '../../core/moduleConfig.js';
import { TEXT_DEFAULTS as EMBED_TEXT_DEFAULTS, type ModLogTexts } from './embeds.js';

export interface ModLogConfig {
  channelId: string;
  logMessageDeleted: boolean;
  logMemberLeft: boolean;
  logMemberKicked: boolean;
  logMemberBanned: boolean;
  logMemberUnbanned: boolean;
}

export const CONFIG_DEFAULTS: ModLogConfig = {
  channelId: '',
  logMessageDeleted: true,
  logMemberLeft: true,
  logMemberKicked: true,
  logMemberBanned: true,
  logMemberUnbanned: true,
};

export const TEXT_DEFAULTS: ModLogTexts = EMBED_TEXT_DEFAULTS;

const module = createModuleConfig('moderation-log', CONFIG_DEFAULTS, TEXT_DEFAULTS);

export const NAMESPACE = module.NAMESPACE;
export const config = module.config;
export const texts = module.texts;

export function logChannelId(): string | undefined {
  const id = config().channelId.trim();
  return id === '' ? undefined : id;
}
