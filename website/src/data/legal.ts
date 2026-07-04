import { siteName } from './nav';
import { DISCORD_TTT, SITE_URL } from './site';

/** Public operator label and contact — no postal address. */
export const legalContact = {
  operatorName: siteName,
  discordUrl: DISCORD_TTT,
  siteUrl: SITE_URL,
} as const;
