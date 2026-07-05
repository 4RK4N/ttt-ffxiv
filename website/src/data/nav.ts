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

function pickNavItems(items: NavItem[], paths: readonly string[]): NavItem[] {
  const byPath = new Map(items.map((item) => [item.path, item]));
  return paths.map((path) => {
    const item = byPath.get(path);
    if (!item) throw new Error(`Nav item not found for path: ${path}`);
    return item;
  });
}

/** Main menu per language (order matters). Used for mobile drawer and lg+ flat nav. */
export const navItems: Record<Lang, NavItem[]> = {
  de: [
    { label: "Über Uns", path: "/de/uber-uns/" },
    { label: "Hausregeln", path: "/de/regeln/" },
    { label: "Events", path: "/de/events/" },
    { label: "Staff", path: "/de/staff/" },
    { label: "Partner", path: "/de/partner/" },
    { label: "Mitwirken", path: "/de/mitwirken/" },
    { label: "Galerie", path: "/de/galerie/" },
    { label: "Gästebuch", path: "/de/gaestebuch/" },
  ],
  en: [
    { label: "About", path: "/en/about/" },
    { label: "Rules", path: "/en/rules/" },
    { label: "Events", path: "/en/events/" },
    { label: "Staff", path: "/en/staff/" },
    { label: "Partner", path: "/en/partner/" },
    { label: "Join us", path: "/en/join/" },
    { label: "Gallery", path: "/en/gallery/" },
    { label: "Guestbook", path: "/en/guestbook/" },
  ],
};

/** Paths shown inline in grouped desktop nav (md to lg). Order matters. */
const navPrimaryPaths: Record<Lang, readonly string[]> = {
  de: [
    "/de/uber-uns/",
    "/de/regeln/",
    "/de/events/",
    "/de/galerie/",
    "/de/gaestebuch/",
  ],
  en: [
    "/en/about/",
    "/en/rules/",
    "/en/events/",
    "/en/gallery/",
    "/en/guestbook/",
  ],
};

/** Paths grouped under the Community dropdown (md to lg). Order matters. */
const navCommunityPaths: Record<Lang, readonly string[]> = {
  de: ["/de/staff/", "/de/partner/", "/de/mitwirken/"],
  en: ["/en/staff/", "/en/partner/", "/en/join/"],
};

/** Primary nav links — always visible in grouped desktop nav (md to lg). */
export const navPrimary: Record<Lang, NavItem[]> = {
  de: pickNavItems(navItems.de, navPrimaryPaths.de),
  en: pickNavItems(navItems.en, navPrimaryPaths.en),
};

/** Community subgroup — dropdown on md–lg desktop nav. */
export const navCommunity: Record<Lang, NavItem[]> = {
  de: pickNavItems(navItems.de, navCommunityPaths.de),
  en: pickNavItems(navItems.en, navCommunityPaths.en),
};

export const navCommunityLabel: Record<Lang, string> = {
  de: "Community",
  en: "Community",
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
  "/de/events/": { de: "/de/events/", en: "/en/events/" },
  "/en/events/": { de: "/de/events/", en: "/en/events/" },
  "/de/staff/": { de: "/de/staff/", en: "/en/staff/" },
  "/en/staff/": { de: "/de/staff/", en: "/en/staff/" },
  "/de/partner/": { de: "/de/partner/", en: "/en/partner/" },
  "/en/partner/": { de: "/de/partner/", en: "/en/partner/" },
  "/de/mitwirken/": { de: "/de/mitwirken/", en: "/en/join/" },
  "/en/join/": { de: "/de/mitwirken/", en: "/en/join/" },
  "/de/galerie/": { de: "/de/galerie/", en: "/en/gallery/" },
  "/en/gallery/": { de: "/de/galerie/", en: "/en/gallery/" },
  "/de/gaestebuch/": { de: "/de/gaestebuch/", en: "/en/guestbook/" },
  "/en/guestbook/": { de: "/de/gaestebuch/", en: "/en/guestbook/" },
  "/de/impressum/": { de: "/de/impressum/", en: "/en/imprint/" },
  "/en/imprint/": { de: "/de/impressum/", en: "/en/imprint/" },
  "/de/datenschutz/": { de: "/de/datenschutz/", en: "/en/privacy/" },
  "/en/privacy/": { de: "/de/datenschutz/", en: "/en/privacy/" },
};
