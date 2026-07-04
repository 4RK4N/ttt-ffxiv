import type { ImageMetadata } from 'astro';
import { getImage } from 'astro:assets';

export async function buildResponsivePreload(
  src: ImageMetadata,
  widths: number[],
  sizes: string,
) {
  const srcset = (
    await Promise.all(
      widths.map((w) => getImage({ src, width: w, format: 'webp' })),
    )
  )
    .map((img, i) => `${img.src} ${widths[i]}w`)
    .join(', ');
  return { srcset, sizes };
}
