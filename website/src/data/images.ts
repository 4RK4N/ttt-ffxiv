import type { ImageMetadata } from "astro";

import logo from "../assets/custom/logo.png";
import bg from "../assets/images/bg.jpg";
import homeCircle from "../assets/images/image22.png";

import image04 from "../assets/images/image04.jpg";
import image09 from "../assets/images/image09.jpg";
import drinksMenu from "../assets/images/Ralvus_karte_v2_upscaled.png";

export { logo, bg, homeCircle };

/** Inline content images (events archive, gallery hero). */
export const pageImages = {
  image04,
  image09,
  drinksMenu,
} as const satisfies Record<string, ImageMetadata>;

const galleryModules = import.meta.glob<ImageMetadata>(
  "../assets/images/gallery*/**/*.{jpg,jpeg,png}",
  { eager: true, import: "default" },
);

const galleryByPath = new Map<string, ImageMetadata>();
for (const [key, mod] of Object.entries(galleryModules)) {
  const suffix = key.replace("../assets/images/", "");
  galleryByPath.set(suffix, mod);
}

/** Resolve a gallery path suffix (e.g. `gallery03/foo.jpg`) to imported metadata. */
export function resolveGallery(suffix: string): ImageMetadata {
  const img = galleryByPath.get(suffix);
  if (!img) {
    throw new Error(`Gallery image not found: ${suffix}`);
  }
  return img;
}

export function resolveGalleryList(paths: readonly string[]): ImageMetadata[] {
  return paths.map(resolveGallery);
}
