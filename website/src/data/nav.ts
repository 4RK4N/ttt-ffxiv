import { SERVER_LINE } from "./site";

export type Lang = "de" | "en";

export const siteName = "Tiny Temptation Tubs";

/** Default meta / Open Graph description per language. */
export const siteDescription: Record<Lang, string> = {
  en: `Step inside, leave your worries behind. A cozy FFXIV roleplay bathhouse on ${SERVER_LINE}.`,
  de: `Tritt ein und lege die Last des Alltags ab. Ein gemütliches FFXIV-RP-Badehaus auf ${SERVER_LINE}.`,
};

export interface NavItem {
  label: string;
  path: string;
}

export interface NavDropdownGroup {
  label: string;
  items: NavItem[];
}

/** Primary links plus Pics and Community submenus — single menu definition per language. */
export interface SiteMenu {
  primaryLead: NavItem[];
  pics: NavDropdownGroup;
  primaryTrail: NavItem[];
  community: NavDropdownGroup;
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
    { label: "Hausregeln", path: "/de/regeln/" },
    { label: "Events", path: "/de/pics/events/" },
    { label: "Karte", path: "/de/karte/" },
    { label: "Staff", path: "/de/community/staff/" },
    { label: "Partner", path: "/de/community/partner/" },
    { label: "Mitwirken", path: "/de/community/mitwirken/" },
    { label: "Galerie", path: "/de/pics/galerie/" },
    { label: "Gästebuch", path: "/de/gaestebuch/" },
  ],
  en: [
    { label: "About", path: "/en/about/" },
    { label: "Rules", path: "/en/rules/" },
    { label: "Events", path: "/en/pics/events/" },
    { label: "Menu", path: "/en/menu/" },
    { label: "Staff", path: "/en/community/staff/" },
    { label: "Partner", path: "/en/community/partner/" },
    { label: "Join us", path: "/en/community/join/" },
    { label: "Gallery", path: "/en/pics/gallery/" },
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
    community: readonly string[];
  }
> = {
  de: {
    primaryLead: ["/de/uber-uns/", "/de/regeln/", "/de/karte/"],
    pics: ["/de/pics/events/", "/de/pics/galerie/"],
    primaryTrail: ["/de/gaestebuch/"],
    community: [
      "/de/community/staff/",
      "/de/community/partner/",
      "/de/community/mitwirken/",
    ],
  },
  en: {
    primaryLead: ["/en/about/", "/en/rules/", "/en/menu/"],
    pics: ["/en/pics/events/", "/en/pics/gallery/"],
    primaryTrail: ["/en/guestbook/"],
    community: [
      "/en/community/staff/",
      "/en/community/partner/",
      "/en/community/join/",
    ],
  },
};

const picsMenuLabel: Record<Lang, string> = {
  en: "Pics",
  de: "Bilder",
};

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
    community: {
      label: "Community",
      items: pickNavItems(pages, paths.community),
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
  "/de/pics/events/": { de: "/de/pics/events/", en: "/en/pics/events/" },
  "/en/pics/events/": { de: "/de/pics/events/", en: "/en/pics/events/" },
  "/de/karte/": { de: "/de/karte/", en: "/en/menu/" },
  "/en/menu/": { de: "/de/karte/", en: "/en/menu/" },
  "/de/community/staff/": {
    de: "/de/community/staff/",
    en: "/en/community/staff/",
  },
  "/en/community/staff/": {
    de: "/de/community/staff/",
    en: "/en/community/staff/",
  },
  "/de/community/partner/": {
    de: "/de/community/partner/",
    en: "/en/community/partner/",
  },
  "/en/community/partner/": {
    de: "/de/community/partner/",
    en: "/en/community/partner/",
  },
  "/de/community/mitwirken/": {
    de: "/de/community/mitwirken/",
    en: "/en/community/join/",
  },
  "/en/community/join/": {
    de: "/de/community/mitwirken/",
    en: "/en/community/join/",
  },
  "/de/pics/galerie/": { de: "/de/pics/galerie/", en: "/en/pics/gallery/" },
  "/en/pics/gallery/": { de: "/de/pics/galerie/", en: "/en/pics/gallery/" },
  "/de/gaestebuch/": { de: "/de/gaestebuch/", en: "/en/guestbook/" },
  "/en/guestbook/": { de: "/de/gaestebuch/", en: "/en/guestbook/" },
  "/de/impressum/": { de: "/de/impressum/", en: "/en/imprint/" },
  "/en/imprint/": { de: "/de/impressum/", en: "/en/imprint/" },
  "/de/datenschutz/": { de: "/de/datenschutz/", en: "/en/privacy/" },
  "/en/privacy/": { de: "/de/datenschutz/", en: "/en/privacy/" },
};
