import { createCanvas, GlobalFonts, loadImage, type SKRSContext2D } from '@napi-rs/canvas';
import { moduleDataPath } from '../../core/texts.js';

// Assets live in the runtime data dir (data/welcome-message/), so they can be
// swapped without a rebuild and are not tied to the compiled output.
const BACKGROUND_PATH = moduleDataPath('welcome-message', 'media', 'background.png');
const FONT_PATH = moduleDataPath('welcome-message', 'fonts', 'DancingScript.ttf');
const FONT_FAMILY = 'Dancing Script';

if (!GlobalFonts.has(FONT_FAMILY)) {
  GlobalFonts.registerFromPath(FONT_PATH, FONT_FAMILY);
}

const SUBTITLE = 'Welcome to Tiny Temptation Tubs';

// Opacity of the uniform dark tint laid over the background (0 = none, 1 = black).
const BACKGROUND_DIM = 0.18;

export interface WelcomeCardOptions {
  avatarUrl: string;
  displayName: string;
}

/** Shrinks the font until `text` fits within `maxWidth` (down to `minPx`). */
function fitFontSize(
  ctx: SKRSContext2D,
  text: string,
  weight: number,
  startPx: number,
  minPx: number,
  maxWidth: number
): number {
  let size = startPx;
  ctx.font = `${weight} ${size}px "${FONT_FAMILY}"`;
  while (ctx.measureText(text).width > maxWidth && size > minPx) {
    size -= 2;
    ctx.font = `${weight} ${size}px "${FONT_FAMILY}"`;
  }
  return size;
}

/**
 * Renders a MEE6-style welcome card: the supplied background, the member's
 * avatar in a circle near the top, then a name line and subtitle in Dancing
 * Script. Returns a PNG buffer.
 */
export async function renderWelcomeCard({
  avatarUrl,
  displayName,
}: WelcomeCardOptions): Promise<Buffer> {
  const background = await loadImage(BACKGROUND_PATH);
  const width = background.width;
  const height = background.height;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  ctx.drawImage(background, 0, 0, width, height);

  // Slight, uniform darkening across the whole card for text contrast / mood.
  // Full-bleed (covers the entire image) so there is no hard-edged dark box in
  // the middle like the original MEE6 card. Tune BACKGROUND_DIM to taste (0 = none).
  ctx.fillStyle = `rgba(0, 0, 0, ${BACKGROUND_DIM})`;
  ctx.fillRect(0, 0, width, height);

  const avatarRes = await fetch(avatarUrl);
  if (!avatarRes.ok) {
    throw new Error(`Failed to fetch avatar (HTTP ${avatarRes.status}).`);
  }
  const avatar = await loadImage(Buffer.from(await avatarRes.arrayBuffer()));

  const centerX = width / 2;
  const centerY = height * 0.4;
  const radius = height * 0.26;

  // Avatar clipped to a circle.
  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(avatar, centerX - radius, centerY - radius, radius * 2, radius * 2);
  ctx.restore();

  // Light-purple ring around the avatar.
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.lineWidth = Math.max(3, height * 0.012);
  ctx.strokeStyle = 'rgba(216, 191, 240, 0.95)';
  ctx.stroke();

  // Shared text styling: centered with a strong drop shadow so the text stays
  // readable over both the bright (logo) and busy parts of the background.
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
  ctx.shadowBlur = height * 0.038;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = height * 0.009;

  const maxTextWidth = width * 0.9;

  const nameLine = `${displayName} just joined`;
  const nameSize = fitFontSize(ctx, nameLine, 700, height * 0.14, height * 0.06, maxTextWidth);
  ctx.font = `700 ${nameSize}px "${FONT_FAMILY}"`;
  ctx.fillStyle = '#e9d8f7';
  ctx.fillText(nameLine, centerX, height * 0.76);

  const subSize = fitFontSize(ctx, SUBTITLE, 400, height * 0.08, height * 0.04, maxTextWidth);
  ctx.font = `400 ${subSize}px "${FONT_FAMILY}"`;
  ctx.fillStyle = '#e9d8f7';
  ctx.fillText(SUBTITLE, centerX, height * 0.9);

  return canvas.encode('png');
}
