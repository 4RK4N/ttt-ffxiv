import { type Lang, siteName } from "./nav";
import { DISCORD_TTT, SITE_URL } from "./site";

/** Public operator label and contact — no postal address. */
export const legalContact = {
  operatorName: siteName,
  discordUrl: DISCORD_TTT,
  siteUrl: SITE_URL,
} as const;

export type LegalPageKind = "imprint" | "privacy";

interface LegalPageCopy {
  title: string;
  path: string;
  heading: string;
}

export const legalCopy: Record<LegalPageKind, Record<Lang, LegalPageCopy>> = {
  imprint: {
    en: {
      title: "Imprint | Tiny Temptation Tubs",
      path: "/en/imprint/",
      heading: "Imprint",
    },
    de: {
      title: "Impressum | Tiny Temptation Tubs",
      path: "/de/impressum/",
      heading: "Impressum",
    },
  },
  privacy: {
    en: {
      title: "Privacy Policy | Tiny Temptation Tubs",
      path: "/en/privacy/",
      heading: "Privacy Policy",
    },
    de: {
      title: "Datenschutz | Tiny Temptation Tubs",
      path: "/de/datenschutz/",
      heading: "Datenschutz",
    },
  },
};
