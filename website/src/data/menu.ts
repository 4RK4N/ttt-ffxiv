import type { Lang } from "./nav";

interface MenuPageCopy {
  title: string;
  path: string;
  heading: string;
  menuAlt: string;
}

export const menuCopy: Record<Lang, MenuPageCopy> = {
  en: {
    title: "Menu | Tiny Temptation Tubs",
    path: "/en/menu/",
    heading: "Menu",
    menuAlt:
      "Drinks menu at Tiny Temptation Tubs, served by Ralvus the bartender",
  },
  de: {
    title: "Karte | Tiny Temptation Tubs",
    path: "/de/karte/",
    heading: "Karte",
    menuAlt:
      "Getränkekarte im Tiny Temptation Tubs, serviert von Ralvus dem Barkeeper",
  },
};
