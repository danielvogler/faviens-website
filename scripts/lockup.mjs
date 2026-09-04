/**
 * The lockups, composed from two rasterised parts rather than laid out in SVG.
 *
 * The reason is that the rasteriser has no access to Archivo and resolves a
 * fallback face whose advance widths are not the ones the file names. Anything
 * positioned against the width of a text run is therefore positioned against a
 * number nobody knows at authoring time: an SVG that puts the circle at a fixed
 * x and anchors the wordmark's right edge at another gets whatever gap the
 * fallback happens to leave, which is how the first version of the link preview
 * ended up with twice the specified gap. Composing measured images has no such
 * dependency.
 *
 * Two measurements make the whole thing font-independent, and both fall out of
 * the wordmark's own trimmed ink:
 *
 *   - The bar is the tallest element in the wordmark. It rises 0.17 of a cap
 *     above the capitals and drops 0.17 below the baseline, where the letters
 *     run from the cap line to the baseline and no further. So the trimmed
 *     wordmark's HEIGHT is the bar's height, and the bar's height is by
 *     construction the circle's width. The circle is sized from it directly.
 *   - The bar is centred on the cap midline. Being also the tallest element,
 *     that makes the cap midline the trimmed image's vertical CENTRE, which is
 *     where the circle has to be centred. So the two are simply centred on each
 *     other.
 *
 * Everything else is stated in units of that height, which is what the brand
 * package's spec is stated in as well, one conversion removed.
 */
import sharp from 'sharp';
import { INK_RATIO, DIAMETER_CAPS } from '../src/lib/globe.mjs';

/** Rendered at this multiple of the target before trimming, so glyph edges are
 *  resampled rather than drawn straight onto a small canvas. */
const SUPERSAMPLE = 6;

/**
 * The gap between circle and wordmark, as a fraction of the lockup's height.
 *
 * The spec's 0.35 cap heights is measured from the circle's NOMINAL box edge,
 * and the rendered circle is its ink, which runs 3% wider. Half that overhang
 * has already been spent by the time the ink ends, so it comes off the gap.
 */
const GAP_CAPS = 0.35;
const GAP_RATIO = (GAP_CAPS - ((INK_RATIO - 1) / 2) * DIAMETER_CAPS) / (DIAMETER_CAPS * INK_RATIO);

/**
 * The stacked lockup's proportions, in units of the circle's ink width.
 *
 * The package sets the wordmark's width equal to the circle's nominal diameter,
 * because anything wider makes the type outweigh the mark: the circle is mostly
 * white space and the type is solid. The 18 is its gap, in the same units.
 */
const STACK_WORD_RATIO = 1 / INK_RATIO;
const STACK_GAP_RATIO = 18 / 176 / INK_RATIO;

const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

/** The descriptor is supersampled for the same reason the lockup parts are. */
const DESCRIPTOR_SUPERSAMPLE = 4;

/**
 * The lockup height the descriptor template's own type size was drawn against.
 *
 * The template states a font size in finished pixels, so it only has the right
 * proportion at one lockup height. Scaling it by the ratio keeps the line the
 * same size relative to the mark at every canvas.
 */
const DESCRIPTOR_BASE_HEIGHT = 190;

/**
 * Rasterises an SVG and crops it to its ink.
 * @returns {Promise<{ data: Buffer, width: number, height: number }>}
 */
async function ink(svg, density) {
  const data = await sharp(Buffer.from(svg), { density }).trim({ threshold: 1 }).png().toBuffer();
  const { width, height } = await sharp(data).metadata();
  return { data, width, height };
}

/**
 * Scales a trimmed buffer, keeping its aspect, and reports what it became.
 *
 * One dimension is asked for and the other is read back rather than computed.
 * Passing both to `resize` means passing a rounded number, and sharp's default
 * fit is `cover`, so it crops to make the rounded aspect exact: the descriptor
 * line came out with the first and last glyph shaved off, symmetrically, which
 * looks like a font problem and is not one.
 */
async function scaled(part, dimension) {
  const data = await sharp(part.data).resize(dimension).png().toBuffer();
  const { width, height } = await sharp(data).metadata();
  return { data, width, height };
}

/** Scales a trimmed buffer to an exact height. */
const toHeight = (part, height) => scaled(part, { height });

/** Scales a trimmed buffer to an exact width. */
const toWidth = (part, width) => scaled(part, { width });

/**
 * Circle left, wordmark right, centred on each other.
 *
 * @param {{ wordmark: string, mark: string, height: number }} options resolved
 *   SVG sources and the lockup's ink height in pixels
 * @returns {Promise<{ data: Buffer, width: number, height: number, wordmarkLeft: number }>}
 */
export async function horizontalLockup({ wordmark, mark, height }) {
  const density = 72 * SUPERSAMPLE;
  const word = await toHeight(await ink(wordmark, density), height);
  // The circle is as wide as the wordmark is tall, which is the bar's height.
  const globe = await toHeight(await ink(mark, density), height);
  const gap = Math.round(GAP_RATIO * height);
  const width = globe.width + gap + word.width;

  const data = await sharp({
    create: { width, height, channels: 4, background: TRANSPARENT },
  })
    .composite([
      { input: globe.data, left: 0, top: 0 },
      { input: word.data, left: globe.width + gap, top: 0 },
    ])
    .png()
    .toBuffer();

  return { data, width, height, wordmarkLeft: globe.width + gap };
}

/**
 * Circle above, wordmark beneath, centred on each other.
 *
 * @param {{ wordmark: string, mark: string, width: number }} options resolved
 *   SVG sources and the circle's ink width in pixels
 * @returns {Promise<{ data: Buffer, width: number, height: number }>}
 */
export async function stackedLockup({ wordmark, mark, width }) {
  const density = 72 * SUPERSAMPLE;
  const globe = await toWidth(await ink(mark, density), width);
  const word = await toWidth(await ink(wordmark, density), Math.round(STACK_WORD_RATIO * width));
  const gap = Math.round(STACK_GAP_RATIO * width);
  const height = globe.height + gap + word.height;

  const data = await sharp({
    create: { width, height, channels: 4, background: TRANSPARENT },
  })
    .composite([
      { input: globe.data, left: 0, top: 0 },
      { input: word.data, left: Math.round((width - word.width) / 2), top: globe.height + gap },
    ])
    .png()
    .toBuffer();

  return { data, width, height };
}

/**
 * The horizontal lockup with the descriptor line beneath it, as one block.
 *
 * The descriptor aligns with the WORDMARK's left edge, not the circle's. The
 * circle is the logo's own hanging indent, and a line of type starting under it
 * would read as a second, wider column.
 *
 * Returned transparent and cropped to its ink, so a caller places it on
 * whatever ground and canvas the destination wants.
 *
 * @param {{ wordmark: string, mark: string, descriptor: string, height: number, gap: number }} options
 *   resolved SVG sources, the lockup's ink height, and the gap from the
 *   lockup's bottom to the descriptor's cap top, both in pixels
 * @returns {Promise<{ data: Buffer, width: number, height: number }>}
 */
export async function lockupBlock({ wordmark, mark, descriptor, height, gap }) {
  const logo = await horizontalLockup({ wordmark, mark, height });

  /*
   * Drawn at four times size and scaled back down, so the letterforms are
   * resampled rather than rendered straight onto a small canvas. The template's
   * units are its finished pixels, so the scale comes back off afterwards.
   */
  const large = await ink(descriptor, 72 * DESCRIPTOR_SUPERSAMPLE);
  const line = await toWidth(
    large,
    Math.round((large.width / DESCRIPTOR_SUPERSAMPLE) * (height / DESCRIPTOR_BASE_HEIGHT)),
  );

  const width = Math.max(logo.width, logo.wordmarkLeft + line.width);
  const blockHeight = logo.height + gap + line.height;

  const data = await sharp({
    create: { width, height: blockHeight, channels: 4, background: TRANSPARENT },
  })
    .composite([
      { input: logo.data, left: 0, top: 0 },
      { input: line.data, left: logo.wordmarkLeft, top: logo.height + gap },
    ])
    .png()
    .toBuffer();

  return { data, width, height: blockHeight };
}
