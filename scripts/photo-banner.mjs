/**
 * The lockup composed onto a photograph, for a LinkedIn banner.
 *
 * The logo cannot simply be dropped on an image, and the reason is measurable
 * rather than a matter of taste. Against a background of luminance L, ink
 * letters clear 4.5:1 only above L 123, paper letters only below L 117, and the
 * accent, whose luminance is 55, only above L 160. The reversed lockup that the
 * obvious reference uses, white type on a dark photo, therefore has no solution
 * at all: there is no ground where paper letters and the accent both hold.
 *
 * Two treatments come out of that, and no others:
 *
 *   light    ink letters and the accent, on a photo lifted towards paper. The
 *            site's own combination, so nothing about the mark changes.
 *   reverse  paper letters with the red elements in `accent-l`, on a photo
 *            pushed towards ink. `accent-l` is the palette's own token for
 *            reversed settings and it is what makes a dark treatment possible.
 *
 * Nothing here is eyeballed. The veil's opacity is solved from the measured
 * luminance of the region the mark actually lands on, the mark's depth ramp is
 * baked against that same measured ground, and the mark's position is searched
 * for rather than set.
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sharp from 'sharp';
import { paletteFrom } from './tokens.mjs';
import { resolveTemplate } from './template.mjs';
import { lockupBlock } from './lockup.mjs';
import { buildStrands, projectStrands, inkBounds, OPACITY, STROKE } from '../src/lib/globe.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sourceDir = join(__dirname, 'assets');
const stylesheet = join(__dirname, '..', 'src', 'styles', 'global.css');

const palette = paletteFrom(await readFile(stylesheet, 'utf8'));
const rel = (v) => {
  v /= 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
};
const contrast = (a, b) => {
  const x = rel(a),
    y = rel(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};
const lumOf = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255);
};

const hex2rgb = (h) => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
/*
 * Rendered stroke thickness, in pixels, held constant across sizes.
 *
 * The logo's own proportion works out at 0.62px on a 104px ball and shows the
 * most structure, but LinkedIn scales a 1584px banner down on a desktop, and at
 * 0.44px the strands go faint. 0.75 keeps the winding legible after that
 * downscale without the strands closing into a disc.
 */
const STROKE_PX = 0.75;
const rgb2hex = (c) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');

/**
 * The mark with its depth ramp BAKED against the ground it will sit on.
 *
 * The logo draws its three depth layers at 0.38 / 0.95 / 1.00 opacity, and that
 * ramp is what makes the sphere turn: the far side has to recede. Flattening
 * every strand to full opacity, which is the obvious way to stop a photograph
 * showing through the back layer, throws the ramp away and the mark collapses
 * into a dense scribble with no depth at all.
 *
 * The brand package says what to do instead: composite each layer's opacity
 * against the ground once, and draw the results as solid strokes. The depth
 * survives and nothing is transparent, so no photograph can leak through. On
 * paper those bake to #FF000D, #FF0A17 and #FF9BA3, which is the package's own
 * table; here the ground is whatever the veiled photo turns out to be, so it is
 * sampled rather than assumed.
 */
function bakedMark(colour, ground, weight) {
  const strand = hex2rgb(colour);
  const bg = hex2rgb(ground);
  const b = projectStrands(buildStrands({ steps: 110 }), 0);
  const k = inkBounds(b);
  const layers = OPACITY.map((o) => rgb2hex(strand.map((v, i) => o * v + (1 - o) * bg[i])));
  // One path per depth, each in its own baked colour, back first.
  const body = b
    .map((bucket, depth) => {
      const d = bucket
        .map((run) => 'M' + run.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L'))
        .join('');
      return `<path d="${d}" fill="none" stroke="${layers[depth]}" stroke-width="${(STROKE[depth] * weight).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round"/>`;
    })
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${k.x.toFixed(3)} ${k.y.toFixed(3)} ${k.width.toFixed(3)} ${k.height.toFixed(3)}">${body}</svg>`;
}

const TREATMENTS = {
  // Ink letters and the accent: the site's own combination, so the photo has to
  // be lifted to the light ground that combination is designed for.
  light: { letters: 'ink', accent: 'accent', veil: 'paper', target: 186 },
  // Reversed. `accent-l` is the palette's own token for exactly this, and it is
  // what makes a dark treatment possible at all: the accent proper cannot clear
  // 3:1 on any ground that paper letters also clear.
  reverse: { letters: 'paper', accent: 'accent-l', veil: 'ink', target: 46 },
};

export async function photoBanner({
  photo,
  width,
  height,
  treatment,
  blockHeight,
  inset,
  align = 'left',
  focus = 0.5,
  horizon,
  horizonAt = 0.55,
}) {
  const t = TREATMENTS[treatment];
  const shade = { ...palette, ink: palette[t.letters], accent: palette[t.accent] };

  const wordmark = resolveTemplate(
    await readFile(join(sourceDir, 'brand-wordmark.svg'), 'utf8'),
    shade,
    'brand-wordmark.svg',
  );
  const descriptor = resolveTemplate(
    await readFile(join(sourceDir, 'descriptor.svg'), 'utf8'),
    // The descriptor takes the letters' own colour, not grey. Grey is chosen
    // against paper; on a photograph it is a mid tone on a mid tone and the
    // line stops being readable at exactly the size it is least legible.
    { ...palette, grey: palette[t.letters], accent: palette[t.accent] },
    'descriptor.svg',
  );

  /*
   * Stroke weight is solved for a constant rendered thickness, not fixed. The
   * multiplier is in mark units, so the logo's own weight of 1 is 0.66px at a
   * 104px ball and 0.39px at a 62px one: the same file, and the smaller icon
   * looks like a different, fainter drawing. 0.9px holds at both.
   */
  const weightFor = (px) => (STROKE_PX * 181) / (1.15 * px);
  const build = (mark) =>
    lockupBlock({
      wordmark,
      mark,
      descriptor,
      height: blockHeight,
      gap: Math.round(blockHeight * 0.23),
    });
  // Built once in a placeholder colour purely to learn the block's size, which
  // is what decides where it goes and therefore what ground it is baked against.
  const block = await build(bakedMark(palette[t.accent], palette[t.veil], weightFor(blockHeight)));

  /*
   * `focus` is the vertical centre of the crop window, as a fraction of the
   * photo. sharp's named positions only offer top, centre and bottom, and a
   * banner cut from a 4:3 photo is a narrow slice: which slice decides whether
   * there is any sky in the frame at all.
   */
  const meta = await sharp(photo).metadata();
  const windowHeight = Math.min(meta.height, Math.round((meta.width * height) / width));

  /*
   * `horizon` is where the skyline sits in the PHOTO; `horizonAt` is where it
   * should sit in the OUTPUT. Given both, the crop follows from the aspect
   * ratio rather than being guessed per size, which matters because a 1128x191
   * cover is a much narrower slice of the same photo than a 1584x396 banner: at
   * a fixed focus the cover loses the mountains entirely while the banner keeps
   * them. Stated as a horizon, one setting composes both identically.
   */
  const centre =
    horizon === undefined ? focus : horizon - (horizonAt - 0.5) * (windowHeight / meta.height);
  const windowTop = Math.max(
    0,
    Math.min(meta.height - windowHeight, Math.round(meta.height * centre - windowHeight / 2)),
  );
  const base = await sharp(photo)
    .extract({ left: 0, top: windowTop, width: meta.width, height: windowHeight })
    .resize(width, height)
    .toBuffer();

  const left = align === 'right' ? width - inset - block.width : inset;

  /*
   * The block finds its own vertical position rather than sitting on the centre
   * line. It is scored on how smooth the region is and how close that region
   * already is to the luminance the mark needs, so on a landscape it settles
   * into the sky: the smoothest, most uniform part of almost any photograph,
   * and the part a mark can sit on without competing with anything.
   *
   * Scoring rather than a rule, because 'put it in the sky' is not something a
   * fixed offset can express. A photo with the horizon high and one with it low
   * need opposite placements, and both are landscapes.
   */
  const { data: raw, info } = await sharp(base).raw().toBuffer({ resolveWithObject: true });
  const regionStats = (x0, y0, w, h) => {
    let sum = 0,
      sq = 0,
      n = 0;
    for (let y = y0; y < y0 + h; y += 2) {
      for (let x = x0; x < x0 + w; x += 3) {
        const i = (y * info.width + x) * info.channels;
        const l = 0.2126 * raw[i] + 0.7152 * raw[i + 1] + 0.0722 * raw[i + 2];
        sum += l;
        sq += l * l;
        n++;
      }
    }
    const mean = sum / n;
    return { mean, sd: Math.sqrt(Math.max(0, sq / n - mean * mean)) };
  };

  /*
   * The block is kept clear of the skyline rather than merely landing somewhere
   * smooth. Without it the search drifts down towards the horizon, because the
   * sky brightens there and the luminance term rewards it, and the descriptor
   * ends up grazing the peaks.
   *
   * The luminance term is deliberately weak. The veil exists to move luminance;
   * it cannot remove clutter, so smoothness is the thing worth searching on.
   */
  const pad = Math.round(height * 0.08);
  const clearance = Math.round(height * 0.07);
  const floor =
    horizon === undefined
      ? height - block.height - pad
      : Math.round(horizonAt * height) - block.height - clearance;
  let best = null;
  for (let top = pad; top <= Math.max(pad, floor); top += 4) {
    const { mean, sd } = regionStats(left, top, block.width, block.height);
    const score = sd + Math.abs(mean - t.target) * 0.06;
    if (!best || score < best.score) best = { top, mean, sd, score };
  }
  const top = best.top;
  const meanL = best.mean;

  const meanRgb = (() => {
    const sum = [0, 0, 0];
    let n = 0;
    for (let y = top; y < top + block.height; y += 2) {
      for (let x = left; x < left + block.width; x += 3) {
        const i = (y * info.width + x) * info.channels;
        sum[0] += raw[i];
        sum[1] += raw[i + 1];
        sum[2] += raw[i + 2];
        n++;
      }
    }
    return sum.map((v) => v / n);
  })();
  const veilL = lumOf(palette[t.veil]);
  const alpha = Math.max(0, Math.min(0.92, (t.target - meanL) / (veilL - meanL)));

  // A gradient, not a flat veil. Covering the whole frame guarantees contrast
  // and destroys the photograph, which is the only reason to use a photograph.
  // This is strongest under the block and gone by the far edge.
  const [x1, x2] = align === 'right' ? ['100%', '0%'] : ['0%', '100%'];
  const veil = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">` +
      `<defs><linearGradient id="v" x1="${x1}" y1="0" x2="${x2}" y2="0">` +
      `<stop offset="0" stop-color="${palette[t.veil]}" stop-opacity="${alpha.toFixed(3)}"/>` +
      `<stop offset="0.42" stop-color="${palette[t.veil]}" stop-opacity="${(alpha * 0.82).toFixed(3)}"/>` +
      `<stop offset="1" stop-color="${palette[t.veil]}" stop-opacity="${(alpha * 0.12).toFixed(3)}"/>` +
      `</linearGradient></defs><rect width="${width}" height="${height}" fill="url(#v)"/></svg>`,
  );
  /*
   * PNG, not JPEG. JPEG's default 4:2:0 chroma subsampling keeps one colour
   * sample per four pixels, and the mark is a saturated red on a dark ground,
   * which is the worst case for it: the bar bleeds and the strands lose their
   * colour entirely. A photograph alone would be fine as JPEG; a photograph
   * with this logo on it is not.
   */
  /*
   * The ground the mark actually lands on: the region's own mean colour with
   * the veil composited over it. Sampling it, rather than assuming paper, is
   * what lets the depth ramp bake correctly against a sky, a dune or a mountain
   * alike.
   */
  const veilRgb = hex2rgb(palette[t.veil]);
  const groundRgb = [0, 1, 2].map((c) => alpha * veilRgb[c] + (1 - alpha) * meanRgb[c]);
  const finalBlock = await build(
    bakedMark(palette[t.accent], rgb2hex(groundRgb), weightFor(blockHeight)),
  );

  const out = await sharp(base)
    .composite([{ input: veil }, { input: finalBlock.data, left, top }])
    .png({ compressionLevel: 9 })
    .toBuffer();

  const after = t.target;
  return {
    data: out,
    meanL,
    alpha,
    block,
    top,
    sd: best.sd,
    letters: contrast(after, lumOf(palette[t.letters])),
    accent: contrast(after, lumOf(palette[t.accent])),
  };
}
