/** Desktop root; global.css scales html font-size at breakpoints, but srcset widths use this base. */
export const ROOT_FONT_PX = 24;

/** Card images go full-width below this (matches narrow content layout). */
export const NARROW_CONTENT_BP_PX = 720;

/** max-w-[45rem] column minus px-6 (1.5rem × 2) padding */
export const CONTENT_COLUMN_PX = 42 * ROOT_FONT_PX;

/** w-56 = 14rem — ContentPage icon */
export const ICON_LAYOUT_PX = 14 * ROOT_FONT_PX;

/** w-72 = 18rem — home hero circle */
export const HERO_CIRCLE_PX = 18 * ROOT_FONT_PX;

/** max-w-[24rem] — events archive image */
export const CARD_IMAGE_PX = 24 * ROOT_FONT_PX;

/** w-48 = 12rem — partner logo */
export const PARTNER_LOGO_PX = 12 * ROOT_FONT_PX;

/** Header logo typical layout width (h-full in 68px bar) */
export const HEADER_LOGO_WIDTH_PX = 127;
export const HEADER_LOGO_HEIGHT_PX = 49;

const GRID_GAP_PX = 12; // gap-3

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
