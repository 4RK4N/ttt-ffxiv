/** Desktop root; global.css scales html font-size at breakpoints (see remScaledSizes). */
const ROOT_FONT_PX = 24;

/** Card images go full-width below this (matches narrow content layout). */
const NARROW_CONTENT_BP_PX = 720;

/** Horizontal padding on .content-section (px-6 × 2). */
const CONTENT_SECTION_PADDING_REM = 3;

/** Section max-widths — keep in sync with --content-max-* in theme.css. */
const CONTENT_MAX_TEXT_REM = 28.333;
const CONTENT_MAX_GALLERY_REM = 40;
const CONTENT_MAX_EVENT_REM = 23.333;

const CONTENT_COLUMN_INNER_REM =
  CONTENT_MAX_TEXT_REM - CONTENT_SECTION_PADDING_REM;

/** Inner content width for full-width images in the default text column. */
export const CONTENT_COLUMN_PX = Math.round(
  CONTENT_COLUMN_INNER_REM * ROOT_FONT_PX,
);

function contentSectionSizes(maxRem: number): string {
  return `calc(min(100vw, ${maxRem}rem) - ${CONTENT_SECTION_PADDING_REM}rem)`;
}

/** min(420px, 78vw) — home hero logo overlay */
export const HERO_REM = 17.5;
export const HERO_LOGO_PX = 420;

/** Featured event poster — synced with --content-max-event */
export const FEATURED_EVENT_REM = CONTENT_MAX_EVENT_REM;
export const FEATURED_EVENT_IMAGE_PX = Math.round(
  FEATURED_EVENT_REM * ROOT_FONT_PX,
);

/** w-48 = 12rem — partner logo */
export const PARTNER_REM = 12;
export const PARTNER_LOGO_PX = PARTNER_REM * ROOT_FONT_PX;

/** Header logo intrinsic dimensions */
const HEADER_LOGO_WIDTH_PX = 127;
const HEADER_LOGO_HEIGHT_PX = 49;

/** Header bar height — synced with --header-height in theme.css. */
const HEADER_HEIGHT_PX = 74;

/** Target logo display height inside the header bar. */
const HEADER_LOGO_TARGET_PX = 54;

/** Header bar height and logo vertical padding — logo scales with rem. */
const HEADER_BAR_PX = HEADER_HEIGHT_PX;
const HEADER_LOGO_PAD_REM =
  (HEADER_HEIGHT_PX - HEADER_LOGO_TARGET_PX) / 2 / ROOT_FONT_PX;

/** Display height of header logo at a given root font size. */
export function headerLogoDisplayHeight(rootPx: number = ROOT_FONT_PX): number {
  return HEADER_BAR_PX - 2 * remPx(HEADER_LOGO_PAD_REM, rootPx);
}

/** Display width of header logo at a given root font size. */
export function headerLogoDisplayPx(rootPx: number = ROOT_FONT_PX): number {
  const logoH = headerLogoDisplayHeight(rootPx);
  return Math.round(logoH * (HEADER_LOGO_WIDTH_PX / HEADER_LOGO_HEIGHT_PX));
}

/** sizes attribute for header logo (h-full w-auto in fixed-height bar). */
export function headerLogoSizes(): string {
  return `(max-width: 480px) ${headerLogoDisplayPx(18)}px, (max-width: 736px) ${headerLogoDisplayPx(20)}px, (max-width: 1280px) ${headerLogoDisplayPx(22)}px, ${headerLogoDisplayPx(24)}px`;
}

/** Fixed srcset widths for build — sizes attrs still drive browser selection. */
const BUILD_WIDTHS = {
  headerLogo: [130, 195, 260],
  hero: [420, 630, 840],
  featuredEvent: [400, 560, 840],
  partner: [288, 432, 576],
  contentColumn: [
    400,
    CONTENT_COLUMN_PX,
    1200,
    Math.round(CONTENT_COLUMN_PX * 1.67),
  ],
  galleryGrid: [400, 800, 1200],
  galleryGridDense: [320, 640, 960],
} as const;

type BuildWidthProfile = keyof typeof BUILD_WIDTHS;

function buildWidths(profile: BuildWidthProfile): number[] {
  return [...BUILD_WIDTHS[profile]];
}

/** srcset widths for header logo. */
export function headerLogoWidths(): number[] {
  return buildWidths("headerLogo");
}

const GRID_GAP_REM = 0.75; // gap-3

/** Rem length at a given root font size (px). */
export function remPx(rem: number, rootPx: number = ROOT_FONT_PX): number {
  return Math.round(rem * rootPx);
}

/** sizes attribute for a rem-width element that tracks global.css root scaling. */
export function remScaledSizes(rem: number): string {
  return `(max-width: 480px) ${remPx(rem, 18)}px, (max-width: 736px) ${remPx(rem, 20)}px, (max-width: 1280px) ${remPx(rem, 22)}px, ${remPx(rem, 24)}px`;
}

const REM_WIDTH_PROFILES: Partial<Record<number, BuildWidthProfile>> = {
  [HERO_REM]: "hero",
  [FEATURED_EVENT_REM]: "featuredEvent",
  [PARTNER_REM]: "partner",
};

/** srcset widths for a rem-width element (hero circle or partner logo). */
export function remScaledWidths(rem: number): number[] {
  const profile = REM_WIDTH_PROFILES[rem];
  if (!profile) {
    throw new Error(`No build widths configured for ${rem}rem element`);
  }
  return buildWidths(profile);
}

/** Full content column for gallery pages. */
export const GALLERY_CONTENT_COLUMN_SIZES = contentSectionSizes(
  CONTENT_MAX_GALLERY_REM,
);

/** srcset widths for full-width content column images. */
export function contentColumnWidths(): number[] {
  return buildWidths("contentColumn");
}

/** 2-column gallery sizes — 1 col below sm, 2 cols at sm+. */
export const GALLERY_GRID_SIZES =
  `(max-width: 640px) ${contentSectionSizes(CONTENT_MAX_TEXT_REM)}, ` +
  `calc((${contentSectionSizes(CONTENT_MAX_TEXT_REM)} - ${GRID_GAP_REM}rem) / 2)`;

/** 2-column gallery sizes for gallery/guestbook pages. */
export const GALLERY_GRID_SIZES_WIDE =
  `(max-width: 640px) ${contentSectionSizes(CONTENT_MAX_GALLERY_REM)}, ` +
  `calc((${contentSectionSizes(CONTENT_MAX_GALLERY_REM)} - ${GRID_GAP_REM}rem) / 2)`;

/** 3-column gallery sizes — 2 cols below sm, 3 cols at sm+. */
export const GALLERY_GRID_3COL_SIZES =
  `(max-width: 640px) calc((min(100vw, ${CONTENT_MAX_TEXT_REM}rem) - ${CONTENT_SECTION_PADDING_REM}rem - ${GRID_GAP_REM}rem) / 2), ` +
  `calc((min(100vw, ${CONTENT_MAX_TEXT_REM}rem) - ${CONTENT_SECTION_PADDING_REM}rem - 1.5rem) / 3)`;

/** 3-column gallery sizes for gallery/guestbook pages. */
export const GALLERY_GRID_3COL_SIZES_WIDE =
  `(max-width: 640px) calc((${contentSectionSizes(CONTENT_MAX_GALLERY_REM)} - ${GRID_GAP_REM}rem) / 2), ` +
  `calc((${contentSectionSizes(CONTENT_MAX_GALLERY_REM)} - 1.5rem) / 3)`;

/** 5-column gallery sizes — calc() tracks rem scaling and column max-width. */
export const GALLERY_GRID_DENSE_SIZES =
  `(max-width: 640px) calc((min(100vw, ${CONTENT_MAX_TEXT_REM}rem) - ${CONTENT_SECTION_PADDING_REM}rem - ${GRID_GAP_REM}rem) / 2), ` +
  `(max-width: 1024px) calc((min(100vw, ${CONTENT_MAX_TEXT_REM}rem) - ${CONTENT_SECTION_PADDING_REM}rem - 1.5rem) / 3), ` +
  `calc((min(100vw, ${CONTENT_MAX_TEXT_REM}rem) - ${CONTENT_SECTION_PADDING_REM}rem - 3rem) / 5)`;

/** 5-column gallery sizes for gallery/guestbook pages. */
export const GALLERY_GRID_DENSE_SIZES_WIDE =
  `(max-width: 640px) calc((${contentSectionSizes(CONTENT_MAX_GALLERY_REM)} - ${GRID_GAP_REM}rem) / 2), ` +
  `(max-width: 1024px) calc((${contentSectionSizes(CONTENT_MAX_GALLERY_REM)} - 1.5rem) / 3), ` +
  `calc((${contentSectionSizes(CONTENT_MAX_GALLERY_REM)} - 3rem) / 5)`;

/** srcset widths for default 2-column gallery cells. */
export function galleryGridWidths(): number[] {
  return buildWidths("galleryGrid");
}

/** srcset widths for dense 5-column gallery cells. */
export function galleryGridDenseWidths(): number[] {
  return buildWidths("galleryGridDense");
}

/** Featured event poster: full column on narrow screens, max 32rem above. */
export function featuredEventImageSizes(): string {
  return `(max-width: ${NARROW_CONTENT_BP_PX}px) calc(100vw - 3rem), ${remScaledSizes(FEATURED_EVENT_REM)}`;
}
