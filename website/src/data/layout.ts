/** Desktop root; global.css scales html font-size at breakpoints (see remScaledSizes). */
export const ROOT_FONT_PX = 24;

/** Root font sizes at global.css breakpoints (max-width in px). */
export const ROOT_FONT_SCALES = [
  { maxWidth: 480, rootPx: 18 },
  { maxWidth: 736, rootPx: 20 },
  { maxWidth: 1280, rootPx: 22 },
  { maxWidth: Infinity, rootPx: ROOT_FONT_PX },
] as const;

/** Card images go full-width below this (matches narrow content layout). */
export const NARROW_CONTENT_BP_PX = 720;

/** Inner content width: max-w-[45rem] section minus px-6 (1.5rem × 2). */
export const CONTENT_COLUMN_PX = 42 * ROOT_FONT_PX;

/** w-56 = 14rem — ContentPage icon */
export const ICON_REM = 14;
export const ICON_LAYOUT_PX = ICON_REM * ROOT_FONT_PX;

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

/** srcset widths for header logo across root scales. */
export function headerLogoWidths(): number[] {
  const roots = [18, 20, 22, 24] as const;
  const widths = new Set<number>();
  for (const root of roots) {
    const w = headerLogoDisplayPx(root);
    widths.add(w);
    widths.add(w * 2);
  }
  return [...widths].sort((a, b) => a - b);
}

const GRID_GAP_REM = 0.75; // gap-3
const CONTENT_MAX_REM = 45;
const CONTENT_PAD_REM = 3; // px-6 horizontal

/** Rem length at a given root font size (px). */
export function remPx(rem: number, rootPx: number = ROOT_FONT_PX): number {
  return Math.round(rem * rootPx);
}

/** sizes attribute for a rem-width element that tracks global.css root scaling. */
export function remScaledSizes(rem: number): string {
  return `(max-width: 480px) ${remPx(rem, 18)}px, (max-width: 736px) ${remPx(rem, 20)}px, (max-width: 1280px) ${remPx(rem, 22)}px, ${remPx(rem, 24)}px`;
}

/** srcset widths (1× and 2×) for a rem-width element at each root scale. */
export function remScaledWidths(rem: number): number[] {
  const roots = [18, 20, 22, 24] as const;
  const widths = new Set<number>();
  for (const root of roots) {
    const w = remPx(rem, root);
    widths.add(w);
    widths.add(w * 2);
  }
  return [...widths].sort((a, b) => a - b);
}

function contentColumnPx(rootPx: number, viewportPx?: number): number {
  const maxCol = remPx(CONTENT_MAX_REM - CONTENT_PAD_REM, rootPx);
  if (viewportPx === undefined) return maxCol;
  const padded = viewportPx - remPx(CONTENT_PAD_REM, rootPx);
  return Math.min(maxCol, padded);
}

function gridCellPx(cols: number, rootPx: number, viewportPx?: number): number {
  const column = contentColumnPx(rootPx, viewportPx);
  const gap = remPx(GRID_GAP_REM, rootPx);
  return Math.floor((column - (cols - 1) * gap) / cols);
}

/** Portrait gallery sizes — calc() tracks rem scaling and column max-width. */
export const PORTRAIT_GALLERY_SIZES =
  '(max-width: 640px) calc((min(100vw, 45rem) - 3rem - 0.75rem) / 2), ' +
  '(max-width: 1024px) calc((min(100vw, 45rem) - 3rem - 1.5rem) / 3), ' +
  'calc((min(100vw, 45rem) - 3rem - 3rem) / 5)';

/** srcset widths for portrait gallery cells across root scales and a narrow viewport. */
export function portraitGalleryWidths(): number[] {
  return galleryCellWidths([2, 3, 5]);
}

/** Full content column — w-full images inside max-w-[45rem] px-6 sections. */
export const CONTENT_COLUMN_SIZES = 'calc(min(100vw, 45rem) - 3rem)';

/** srcset widths for full-width content column images. */
export function contentColumnWidths(): number[] {
  const roots = [18, 20, 22, 24] as const;
  const widths = new Set<number>();
  for (const root of roots) {
    for (const vw of [undefined, 412] as const) {
      const w = contentColumnPx(root, vw);
      widths.add(w);
      widths.add(w * 2);
    }
  }
  return [...widths].sort((a, b) => a - b);
}

/** Landscape gallery sizes — 1 col below sm, 2 cols at sm+. */
export const LANDSCAPE_GALLERY_SIZES =
  '(max-width: 640px) calc(min(100vw, 45rem) - 3rem), ' +
  'calc((min(100vw, 45rem) - 3rem - 0.75rem) / 2)';

/** srcset widths for landscape gallery cells. */
export function landscapeGalleryWidths(): number[] {
  return galleryCellWidths([1, 2]);
}

/** Events card: full column below NARROW_CONTENT_BP, max-w-[24rem] above. */
export function cardImageSizes(): string {
  return `(max-width: ${NARROW_CONTENT_BP_PX}px) calc(100vw - 3rem), (max-width: 480px) ${remPx(CARD_REM, 18)}px, (max-width: 736px) ${remPx(CARD_REM, 20)}px, (max-width: 1280px) ${remPx(CARD_REM, 22)}px, ${remPx(CARD_REM, 24)}px`;
}

/** srcset widths for events card image (narrow column + rem-scaled card). */
export function cardImageWidths(): number[] {
  const roots = [18, 20, 22, 24] as const;
  const widths = new Set<number>();
  for (const root of roots) {
    for (const vw of [undefined, 412] as const) {
      const col = contentColumnPx(root, vw);
      widths.add(col);
      widths.add(col * 2);
    }
    const card = remPx(CARD_REM, root);
    widths.add(card);
    widths.add(card * 2);
  }
  return [...widths].sort((a, b) => a - b);
}

function galleryCellWidths(colsList: readonly number[]): number[] {
  const roots = [18, 20, 22, 24] as const;
  const widths = new Set<number>();
  for (const root of roots) {
    for (const cols of colsList) {
      for (const vw of [undefined, 412] as const) {
        const cell = gridCellPx(cols, root, vw);
        widths.add(cell);
        widths.add(cell * 2);
      }
    }
  }
  return [...widths].sort((a, b) => a - b);
}

const GRID_GAP_PX = remPx(GRID_GAP_REM);

/** 2-col landscape grid cell in content column */
export const LANDSCAPE_CELL_PX = Math.round((CONTENT_COLUMN_PX - GRID_GAP_PX) / 2);

/** 5-col portrait grid cell at lg */
export const PORTRAIT_CELL_LG_PX = Math.floor(
  (CONTENT_COLUMN_PX - 4 * GRID_GAP_PX) / 5,
);

/** 3-col portrait grid cell at sm–lg */
export const PORTRAIT_CELL_MD_PX = Math.floor(
  (CONTENT_COLUMN_PX - 2 * GRID_GAP_PX) / 3,
);
