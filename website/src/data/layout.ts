/** Desktop root; global.css scales html font-size at breakpoints (see remScaledSizes). */
export const ROOT_FONT_PX = 24;

/** Card images go full-width below this (matches narrow content layout). */
export const NARROW_CONTENT_BP_PX = 720;

/** Inner content width: max-w-[36rem] section minus px-6 (1.5rem × 2). */
export const CONTENT_COLUMN_PX = 33 * ROOT_FONT_PX;

/** w-72 = 18rem — home hero circle */
export const HERO_REM = 18;
export const HERO_CIRCLE_PX = HERO_REM * ROOT_FONT_PX;

/** max-w-[24rem] — events archive image */
export const CARD_REM = 24;
export const CARD_IMAGE_PX = CARD_REM * ROOT_FONT_PX;

/** w-48 = 12rem — partner logo */
export const PARTNER_REM = 12;
export const PARTNER_LOGO_PX = PARTNER_REM * ROOT_FONT_PX;

/** Header logo intrinsic dimensions */
export const HEADER_LOGO_WIDTH_PX = 127;
export const HEADER_LOGO_HEIGHT_PX = 49;

/** Header bar height and logo vertical padding (py-1.5) — logo scales with rem. */
const HEADER_BAR_PX = 68;
const HEADER_LOGO_PAD_REM = 0.375;

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
  hero: [432, 648, 864],
  partner: [288, 432, 576],
  contentColumn: [400, 792, 1200, 1584],
  cardImage: [400, 576, 792, 1200],
  portraitGallery: [320, 640, 960],
  landscapeGallery: [400, 800, 1200],
} as const;

/** srcset widths for header logo. */
export function headerLogoWidths(): number[] {
  return [...BUILD_WIDTHS.headerLogo];
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

/** srcset widths for a rem-width element (hero circle or partner logo). */
export function remScaledWidths(rem: number): number[] {
  if (rem === HERO_REM) return [...BUILD_WIDTHS.hero];
  if (rem === PARTNER_REM) return [...BUILD_WIDTHS.partner];
  throw new Error(`No build widths configured for ${rem}rem element`);
}

/** Portrait gallery sizes — calc() tracks rem scaling and column max-width. */
export const PORTRAIT_GALLERY_SIZES =
  '(max-width: 640px) calc((min(100vw, 36rem) - 3rem - 0.75rem) / 2), ' +
  '(max-width: 1024px) calc((min(100vw, 36rem) - 3rem - 1.5rem) / 3), ' +
  'calc((min(100vw, 36rem) - 3rem - 3rem) / 5)';

/** srcset widths for portrait gallery cells. */
export function portraitGalleryWidths(): number[] {
  return [...BUILD_WIDTHS.portraitGallery];
}

/** Full content column — w-full images inside max-w-[36rem] px-6 sections. */
export const CONTENT_COLUMN_SIZES = 'calc(min(100vw, 36rem) - 3rem)';

/** srcset widths for full-width content column images. */
export function contentColumnWidths(): number[] {
  return [...BUILD_WIDTHS.contentColumn];
}

/** Landscape gallery sizes — 1 col below sm, 2 cols at sm+. */
export const LANDSCAPE_GALLERY_SIZES =
  '(max-width: 640px) calc(min(100vw, 36rem) - 3rem), ' +
  'calc((min(100vw, 36rem) - 3rem - 0.75rem) / 2)';

/** srcset widths for landscape gallery cells. */
export function landscapeGalleryWidths(): number[] {
  return [...BUILD_WIDTHS.landscapeGallery];
}

/** Events card: full column below NARROW_CONTENT_BP, max-w-[24rem] above. */
export function cardImageSizes(): string {
  return `(max-width: ${NARROW_CONTENT_BP_PX}px) calc(100vw - 3rem), (max-width: 480px) ${remPx(CARD_REM, 18)}px, (max-width: 736px) ${remPx(CARD_REM, 20)}px, (max-width: 1280px) ${remPx(CARD_REM, 22)}px, ${remPx(CARD_REM, 24)}px`;
}

/** srcset widths for events card image. */
export function cardImageWidths(): number[] {
  return [...BUILD_WIDTHS.cardImage];
}

const GRID_GAP_PX = remPx(GRID_GAP_REM);

/** 2-col landscape grid cell in content column */
export const LANDSCAPE_CELL_PX = Math.round((CONTENT_COLUMN_PX - GRID_GAP_PX) / 2);

/** 5-col portrait grid cell at lg */
export const PORTRAIT_CELL_LG_PX = Math.floor(
  (CONTENT_COLUMN_PX - 4 * GRID_GAP_PX) / 5,
);
