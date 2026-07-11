import type { Lang } from "./nav";

export const shellLabels: Record<
  Lang,
  {
    skip: string;
    mainMenu: string;
    mobileMenu: string;
    legalNav: string;
    menuToggle: string;
  }
> = {
  en: {
    skip: "Skip to content",
    mainMenu: "Main menu",
    mobileMenu: "Mobile menu",
    legalNav: "Legal",
    menuToggle: "Menu",
  },
  de: {
    skip: "Zum Inhalt springen",
    mainMenu: "Hauptmenü",
    mobileMenu: "Mobilmenü",
    legalNav: "Rechtliches",
    menuToggle: "Menü",
  },
};

export const langSwitchLabels: Record<
  Lang,
  { title: string; altLabel: string }
> = {
  en: { title: "Switch to German", altLabel: "Deutsch" },
  de: { title: "Zu Englisch wechseln", altLabel: "English" },
};

export const timerLabels: Record<
  Lang,
  { units: [string, string, string, string]; open: string }
> = {
  en: {
    units: ["Days", "Hours", "Minutes", "Seconds"],
    open: "We're open!",
  },
  de: {
    units: ["Tage", "Stunden", "Minuten", "Sekunden"],
    open: "Wir haben geöffnet!",
  },
};

export const lightboxLabels: Record<
  Lang,
  {
    dialog: string;
    close: string;
    prev: string;
    next: string;
    zoomIn: string;
    zoomOut: string;
  }
> = {
  en: {
    dialog: "Image viewer",
    close: "Close",
    prev: "Previous image",
    next: "Next image",
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
  },
  de: {
    dialog: "Bildbetrachter",
    close: "Schließen",
    prev: "Vorheriges Bild",
    next: "Nächstes Bild",
    zoomIn: "Vergrößern",
    zoomOut: "Verkleinern",
  },
};

export const eventPhotoAltPrefix: Record<Lang, string> = {
  en: "Event photo",
  de: "Event-Foto",
};
