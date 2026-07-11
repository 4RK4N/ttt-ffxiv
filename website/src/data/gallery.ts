import type { Lang } from "./nav";
import { resolveImages } from "./images";

export const GALLERY_VENUE_PATHS = [
  "gallery/venue/9c352b69.jpg",
  "gallery/venue/fcd8f85d.jpg",
  "gallery/venue/81a2a56a.jpg",
  "gallery/venue/c2cde289.jpg",
  "gallery/venue/09600657.jpg",
  "gallery/venue/009cce14.jpg",
  "gallery/venue/736c6a9a.jpg",
  "gallery/venue/7b549343.jpg",
  "gallery/venue/d7414f9a.jpg",
  "gallery/venue/cac149e2.jpg",
  "gallery/venue/ac774d7a.jpg",
  "gallery/venue/068c47f1.jpg",
  "gallery/venue/eb706e6d.jpg",
  "gallery/venue/dfbe594f.jpg",
] as const;

export const GALLERY_ROOM01_PATHS = [
  "gallery/room01/ffxiv_dx11_2026-07-07_11-52-01.png",
  "gallery/room01/ffxiv_dx11_2026-07-07_11-53-43.png",
  "gallery/room01/ffxiv_dx11_2026-07-07_11-54-26.png",
  "gallery/room01/ffxiv_dx11_2026-07-07_11-54-42.png",
  "gallery/room01/ffxiv_dx11_2026-07-07_11-55-13.png",
  "gallery/room01/ffxiv_dx11_2026-07-07_11-55-31.png",
  "gallery/room01/ffxiv_dx11_2026-07-07_11-55-50.png",
  "gallery/room01/ffxiv_dx11_2026-07-07_11-56-05.png",
] as const;

export const GALLERY_ROOM02_PATHS = [
  "gallery/room02/716cf24b.jpg",
  "gallery/room02/ab4e17c6.jpg",
  "gallery/room02/dddae266.jpg",
  "gallery/room02/f3f31675.jpg",
  "gallery/room02/88a002bb.jpg",
  "gallery/room02/3ec6e4af.jpg",
  "gallery/room02/03ac8647.jpg",
  "gallery/room02/e83b206b.jpg",
] as const;

export const galleryVenueImages = resolveImages(GALLERY_VENUE_PATHS);
export const galleryRoom01Images = resolveImages(GALLERY_ROOM01_PATHS);
export const galleryRoom02Images = resolveImages(GALLERY_ROOM02_PATHS);

interface GalleryVenueCopy {
  title: string;
  path: string;
  heading: string;
  introLead: string;
  introBody: string;
  heroAlt: string;
  altPrefix: string;
  room1Heading: string;
  room2Heading: string;
  roomScreenshotSuffix: string;
}

export const galleryVenueCopy: Record<Lang, GalleryVenueCopy> = {
  en: {
    title: "The Venue | Tiny Temptation Tubs",
    path: "/en/pics/venue/",
    heading: "The Venue",
    introLead: "A glimpse into our home…",
    introBody:
      "Warm rooms, quiet corners, soft lights, and places where memories are made.",
    heroAlt: "Exterior view of the bathhouse at night",
    altPrefix: "Bathhouse screenshot",
    room1Heading: "Room 1",
    room2Heading: "Room 2",
    roomScreenshotSuffix: " screenshot",
  },
  de: {
    title: "Das Haus | Tiny Temptation Tubs",
    path: "/de/bilder/haus/",
    heading: "Das Haus",
    introLead: "Ein Blick in unser Haus…",
    introBody:
      "Warme Räume, stille Ecken, sanftes Licht und Orte, an denen Erinnerungen entstehen.",
    heroAlt: "Außenansicht des Badehauses bei Nacht",
    altPrefix: "Badehaus-Screenshot",
    room1Heading: "Zimmer 1",
    room2Heading: "Zimmer 2",
    roomScreenshotSuffix: "-Screenshot",
  },
};
