import type { Lang } from "./nav";
import { resolveImages } from "./images";

/** Portrait-format staff cards in display order. */
export const STAFF_PORTRAIT_PATHS = [
  "staff/reiji.jpg",
  "staff/soldea.jpg",
  "staff/domi.jpg",
  "staff/elphine.jpg",
  "staff/ralvus.png",
] as const;

/** Landscape-format staff cards — shown last in a 50/50 row. */
export const STAFF_LANDSCAPE_PATHS = [
  "staff/domino.jpg",
  "staff/alice.png",
] as const;

export const staffPortraits = resolveImages(STAFF_PORTRAIT_PATHS);
export const staffLandscape = resolveImages(STAFF_LANDSCAPE_PATHS);

interface StaffCopy {
  altPrefix: string;
  paragraphs: readonly (readonly [string, string])[];
}

export const staffCopy: Record<Lang, StaffCopy> = {
  en: {
    altPrefix: "Staff portrait",
    paragraphs: [
      ["Behind every warm welcome stand those", "who care for the house."],
      [
        "Our hosts, helpers, and guardians",
        "ensure every moment remains pleasant.",
      ],
      ["They keep the balance", "so everyone feels safe and welcome."],
    ],
  },
  de: {
    altPrefix: "Staff portrait",
    paragraphs: [
      [
        "Hinter jedem warmen Empfang stehen jene,",
        "die sich um das Haus kümmern.",
      ],
      [
        "Unsere Gastgeber, Helfer und Wächter",
        "sorgen dafür, dass jeder Moment angenehm bleibt.",
      ],
      [
        "Sie halten das Gleichgewicht,",
        "damit sich jeder sicher und willkommen fühlt.",
      ],
    ],
  },
};
