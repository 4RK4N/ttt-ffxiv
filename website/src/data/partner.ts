import type { Lang } from "./nav";
import { resolveImage } from "./images";

interface BandLogoConfig {
  path: string;
  alt: Record<Lang, string>;
  imageClass?: string;
}

const BAND_LOGO_PATHS: BandLogoConfig[] = [
  {
    path: "gallery/bands/29745391.png",
    alt: {
      en: "The Badger Trinity logo",
      de: "The Badger Trinity Logo",
    },
    imageClass: "scale-125",
  },
  {
    path: "gallery/bands/TheSundering-White.png",
    alt: {
      en: "The Sundering logo",
      de: "The Sundering Logo",
    },
  },
];

export function partnerBandLogos(lang: Lang) {
  return BAND_LOGO_PATHS.map(({ path, alt, imageClass }) => ({
    src: resolveImage(path),
    alt: alt[lang],
    imageClass,
  }));
}
