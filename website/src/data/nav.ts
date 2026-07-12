import { SERVER_LINE } from "./site";

export type Lang = "de" | "en";

export const siteName = "Tiny Temptation Tubs";

/** Default meta / Open Graph description per language. */
export const siteDescription: Record<Lang, string> = {
  en: `Step inside, leave your worries behind. A cozy FFXIV roleplay bathhouse on ${SERVER_LINE.en}.`,
  de: `Tritt ein und lege die Last des Alltags ab. Ein gemütliches FFXIV-RP-Badehaus auf ${SERVER_LINE.de}.`,
};

export interface NavItem {
  label: string;
  path: string;
}

interface NavDropdownGroup {
  label: string;
  items: NavItem[];
}

/** Primary links plus Pics and Team submenus — single menu definition per language. */
export interface SiteMenu {
  primaryLead: NavItem[];
  pics: NavDropdownGroup;
  primaryTrail: NavItem[];
  team: NavDropdownGroup;
}

function pickNavItems(items: NavItem[], paths: readonly string[]): NavItem[] {
  const byPath = new Map(items.map((item) => [item.path, item]));
  return paths.map((path) => {
    const item = byPath.get(path);
    if (!item) throw new Error(`Nav item not found for path: ${path}`);
    return item;
  });
}

/** All navigable pages (labels + paths). */
const navPages: Record<Lang, NavItem[]> = {
  de: [
    { label: "Über Uns", path: "/de/uber-uns/" },
    { label: "Regeln", path: "/de/regeln/" },
    { label: "Events", path: "/de/bilder/events/" },
    { label: "Karte", path: "/de/karte/" },
    { label: "Staff", path: "/de/team/staff/" },
    { label: "Partner", path: "/de/team/partner/" },
    { label: "Mitwirken", path: "/de/team/mitwirken/" },
    { label: "Das Haus", path: "/de/bilder/haus/" },
    { label: "Gästebuch", path: "/de/gaestebuch/" },
  ],
  en: [
    { label: "About", path: "/en/about/" },
    { label: "Rules", path: "/en/rules/" },
    { label: "Events", path: "/en/pics/events/" },
    { label: "Menu", path: "/en/menu/" },
    { label: "Staff", path: "/en/team/staff/" },
    { label: "Partner", path: "/en/team/partner/" },
    { label: "Join us", path: "/en/team/join/" },
    { label: "The Venue", path: "/en/pics/venue/" },
    { label: "Guestbook", path: "/en/guestbook/" },
  ],
};

/** Menu layout — primary order and submenu membership. Paths must exist in navPages. */
const siteMenuPaths: Record<
  Lang,
  {
    primaryLead: readonly string[];
    pics: readonly string[];
    primaryTrail: readonly string[];
    team: readonly string[];
  }
> = {
  de: {
    primaryLead: ["/de/uber-uns/", "/de/regeln/", "/de/karte/"],
    pics: ["/de/bilder/haus/", "/de/bilder/events/"],
    primaryTrail: ["/de/gaestebuch/"],
    team: ["/de/team/staff/", "/de/team/partner/", "/de/team/mitwirken/"],
  },
  en: {
    primaryLead: ["/en/about/", "/en/rules/", "/en/menu/"],
    pics: ["/en/pics/venue/", "/en/pics/events/"],
    primaryTrail: ["/en/guestbook/"],
    team: ["/en/team/staff/", "/en/team/partner/", "/en/team/join/"],
  },
};

const picsMenuLabel: Record<Lang, string> = {
  en: "Pics",
  de: "Bilder",
};

const teamMenuLabel: Record<Lang, string> = {
  en: "Team",
  de: "Team",
};

/** Whether a nav path matches the current page path. */
export function isNavPathActive(
  itemPath: string,
  currentPath: string,
): boolean {
  return itemPath === currentPath;
}

function buildSiteMenu(lang: Lang): SiteMenu {
  const pages = navPages[lang];
  const paths = siteMenuPaths[lang];
  return {
    primaryLead: pickNavItems(pages, paths.primaryLead),
    pics: {
      label: picsMenuLabel[lang],
      items: pickNavItems(pages, paths.pics),
    },
    primaryTrail: pickNavItems(pages, paths.primaryTrail),
    team: {
      label: teamMenuLabel[lang],
      items: pickNavItems(pages, paths.team),
    },
  };
}

export const siteMenu: Record<Lang, SiteMenu> = {
  de: buildSiteMenu("de"),
  en: buildSiteMenu("en"),
};

/** Homepage per language (topbar brand link). */
export const homePath: Record<Lang, string> = {
  de: "/de.html",
  en: "/",
};

/** Footer legal links per language. */
export const footerLinks: Record<Lang, NavItem[]> = {
  de: [
    { label: "Impressum", path: "/de/impressum/" },
    { label: "Datenschutz", path: "/de/datenschutz/" },
  ],
  en: [
    { label: "Imprint", path: "/en/imprint/" },
    { label: "Privacy Policy", path: "/en/privacy/" },
  ],
};

/** Maps each page path to its counterpart in both languages (language switcher). */
export const pathMap: Record<string, Record<Lang, string>> = {
  "/": { de: "/de.html", en: "/" },
  "/de.html": { de: "/de.html", en: "/" },
  "/de/uber-uns/": { de: "/de/uber-uns/", en: "/en/about/" },
  "/en/about/": { de: "/de/uber-uns/", en: "/en/about/" },
  "/de/regeln/": { de: "/de/regeln/", en: "/en/rules/" },
  "/en/rules/": { de: "/de/regeln/", en: "/en/rules/" },
  "/de/bilder/events/": { de: "/de/bilder/events/", en: "/en/pics/events/" },
  "/en/pics/events/": { de: "/de/bilder/events/", en: "/en/pics/events/" },
  "/de/karte/": { de: "/de/karte/", en: "/en/menu/" },
  "/en/menu/": { de: "/de/karte/", en: "/en/menu/" },
  "/de/team/staff/": {
    de: "/de/team/staff/",
    en: "/en/team/staff/",
  },
  "/en/team/staff/": {
    de: "/de/team/staff/",
    en: "/en/team/staff/",
  },
  "/de/team/partner/": {
    de: "/de/team/partner/",
    en: "/en/team/partner/",
  },
  "/en/team/partner/": {
    de: "/de/team/partner/",
    en: "/en/team/partner/",
  },
  "/de/team/mitwirken/": {
    de: "/de/team/mitwirken/",
    en: "/en/team/join/",
  },
  "/en/team/join/": {
    de: "/de/team/mitwirken/",
    en: "/en/team/join/",
  },
  "/de/bilder/haus/": { de: "/de/bilder/haus/", en: "/en/pics/venue/" },
  "/en/pics/venue/": { de: "/de/bilder/haus/", en: "/en/pics/venue/" },
  "/de/gaestebuch/": { de: "/de/gaestebuch/", en: "/en/guestbook/" },
  "/en/guestbook/": { de: "/de/gaestebuch/", en: "/en/guestbook/" },
  "/de/impressum/": { de: "/de/impressum/", en: "/en/imprint/" },
  "/en/imprint/": { de: "/de/impressum/", en: "/en/imprint/" },
  "/de/datenschutz/": { de: "/de/datenschutz/", en: "/en/privacy/" },
  "/en/privacy/": { de: "/de/datenschutz/", en: "/en/privacy/" },
};
