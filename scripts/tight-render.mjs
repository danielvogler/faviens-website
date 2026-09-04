/**
 * Tight rasterisation, shared by the two image scripts.
 *
 * "Tight" means the artwork is measured after it is drawn, not before. Working
 * out where a mark ends analytically would mean knowing the font metrics, and
 * the rasteriser resolves a fallback face whose metrics are not the ones named
 * in the file, so the drawn extent is the only honest measurement available.
 * Draw large, crop to the ink, scale into the margin box, centre on the exact
 * canvas the destination requires.
 */
import sharp from 'sharp';

/** Rendered at this multiple of the target, then trimmed and scaled down, so the
 *  glyph edges are resampled rather than drawn straight onto a small canvas. */
const SUPERSAMPLE = 4;

const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

/** `'#0e0e10'` to `{ r, g, b }`. */
export function hexToRgb(hex) {
  const value = Number.parseInt(hex.slice(1), 16);
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}

/**
 * @param svg resolved SVG source, with no background rect of its own
 * @param width target width in pixels
 * @param height target height in pixels
 * @param ground hex colour to sit the mark on, or null to leave it transparent
 * @param margin share of the shorter side left empty on each edge
 */
export async function renderTight(svg, { width, height, ground, margin }) {
  const trimmed = await sharp(Buffer.from(svg), { density: 72 * SUPERSAMPLE })
    .trim({ threshold: 1 })
    .toBuffer();
  return fitInto(trimmed, { width, height, ground, margin });
}

/**
 * Scales an already-trimmed image into the margin box and centres it on the
 * exact canvas the destination requires.
 *
 * Split out from `renderTight` because the lockups arrive already composed and
 * already trimmed, and running them through a second trim would crop away the
 * transparent margin that keeps the two parts apart.
 *
 * @param trimmed a PNG cropped to its ink
 * @param width target width in pixels
 * @param height target height in pixels
 * @param ground hex colour to sit the mark on, or null to leave it transparent
 * @param margin share of the shorter side left empty on each edge
 */
export async function fitInto(trimmed, { width, height, ground, margin }) {
  const inset = Math.round(Math.min(width, height) * margin);
  const box = { width: width - inset * 2, height: height - inset * 2 };
  if (box.width <= 0 || box.height <= 0) {
    throw new Error(`margin ${margin} leaves no room inside ${width}x${height}.`);
  }

  const composed = await sharp(trimmed)
    .resize({ ...box, fit: 'contain', background: TRANSPARENT })
    .extend({
      top: inset,
      bottom: height - box.height - inset,
      left: inset,
      right: width - box.width - inset,
      background: TRANSPARENT,
    })
    .png()
    .toBuffer();

  // The ground goes on in a second pass, never as the padding colour above. Two
  // separate reasons, both of which shipped a broken tile while this was one
  // pass: sharp flattens before it extends, so a flatten in the same pipeline
  // fills an image that has not been padded yet; and a padding colour only
  // fills what the resize adds around the artwork, never the transparent
  // counter of an A or the gap between two letters. Either way the mark ends up
  // with a paper frame around clear holes, which reads as white on a white page
  // and is visibly broken the moment a client renders it in dark mode.
  const pipeline = sharp(composed);
  if (ground) pipeline.flatten({ background: { ...hexToRgb(ground), alpha: 1 } });
  return pipeline.png({ compressionLevel: 9 }).toBuffer();
}
