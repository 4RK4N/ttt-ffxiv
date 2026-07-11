import type { ImageMetadata } from "astro";

import logo from "../assets/custom/logo.png";
import bg from "../assets/images/content/bg.jpg";
import homeLogo from "../assets/images/content/logo-overlay.png";
import cornerOrnament from "../assets/images/content/corner-ornament.png";
import ornDivider from "../assets/images/content/orn-divider.png";
import bannerWide from "../assets/images/content/banner-wide.png";

import image09 from "../assets/images/content/image09.jpg";
import drinksMenu from "../assets/images/content/Ralvus_karte_v2_upscaled.png";

export { logo, bg, homeLogo, cornerOrnament, ornDivider, bannerWide };

/** Inline content images (gallery hero and drinks menu). */
export const pageImages = {
  image09,
  drinksMenu,
} as const satisfies Record<string, ImageMetadata>;

const imageModules = import.meta.glob<ImageMetadata>(
  "../assets/images/{team,events,gallery,guestbook,partner,staff}/**/*.{jpg,jpeg,png}",
  { eager: true, import: "default" },
);

const imagesByPath = new Map<string, ImageMetadata>();
for (const [key, mod] of Object.entries(imageModules)) {
  const suffix = key.replace("../assets/images/", "");
  imagesByPath.set(suffix, mod);
}

/** Resolve an image path suffix (e.g. `gallery/room01/foo.png`) to metadata. */
export function resolveImage(suffix: string): ImageMetadata {
  const img = imagesByPath.get(suffix);
  if (!img) {
    throw new Error(`Image not found: ${suffix}`);
  }
  return img;
}

export function resolveImages(paths: readonly string[]): ImageMetadata[] {
  return paths.map(resolveImage);
}

/** Guestbook screenshot paths (display order). */
export const GUESTBOOK_IMAGE_PATHS = [
  "guestbook/b04b2349.jpg",
  "guestbook/fb0b75e8.jpg",
  "guestbook/228b4f2a.jpg",
  "guestbook/ca8d23e8.jpg",
  "guestbook/ab7b15ef.jpg",
  "guestbook/4422e621.jpg",
  "guestbook/ca8cef1a.jpg",
  "guestbook/895a9878.jpg",
] as const;

export const guestbookImages = resolveImages(GUESTBOOK_IMAGE_PATHS);

/** Past event photos in archive display order. */
export const EVENT_ARCHIVE_PATHS = [
  "events/Event_04.07.26.jpg",
  "events/Event_20.06.26.png",
  "events/Event_06.06.26.jpg",
  "events/Event_23.05.26.jpg",
  "events/Event_09.05.26.jpg",
  "events/Event_25.04.26.jpg",
  "events/Event_11.04.26.jpg",
] as const;

export const eventArchiveImages = resolveImages(EVENT_ARCHIVE_PATHS);

/** Join / Mitwirken page photos. */
export const JOIN_IMAGE_PATHS = {
  en: ["team/88d650d3.jpg", "team/7a80e7c4.jpg"],
  de: ["team/c4a04ae5.jpg", "team/3cb16362.jpg"],
} as const satisfies Record<"de" | "en", readonly string[]>;

export const joinImages = {
  en: resolveImages(JOIN_IMAGE_PATHS.en),
  de: resolveImages(JOIN_IMAGE_PATHS.de),
};
