/**
 * The Faviens globe: the wound-string mark, generated rather than pasted in.
 *
 * Every strand is a circle lying on a sphere, projected orthographically. The
 * crossings, the bunching at the silhouette and the roundness all fall out of
 * that 3D geometry; 2D noise does not produce the same silhouette, which the
 * brand package records as tried and rejected. Because the geometry is real,
 * the same module that draws the favicon can also turn the sphere, which is
 * what `GlobeField.astro` does.
 *
 * The parameters below are the brand package's `FAVIENS-LOGO-SPEC.md` verbatim,
 * and the RNG in `mt19937.mjs` reproduces CPython's, so seed 7714 draws the same
 * sixty strands here as it did there. `scripts/check-globe.mjs` asserts that
 * against the committed SVG, and `pnpm verify` runs it: the artwork of record
 * wins over this file, and the check is what keeps that true.
 *
 * The RNG is consumed in a fixed order per strand. Changing the order changes
 * the drawing even with the same seed:
 *   gauss x3 -> plane normal, random -> offset, random x2 -> phases,
 *   uniform x2 -> wobble amplitudes.
 *
 * No colour is stated here. Callers pass one in, resolved from the tokens in
 * src/styles/global.css, which is the only place a colour is written.
 */
import { PythonRandom } from './mt19937.mjs';

/** Sphere radius inside the 200-unit box, and the box's centre. */
export const R = 88;
export const CX = 100;
export const CY = 100;
/** The nominal mark box. The drawn ink runs slightly wider, see `inkBounds`. */
export const BOX = 200;

export const SEED = 7714;
/** The logo's strand count. `VARIANTS.dot` is the reduced set for tiny sizes. */
export const STRANDS = 60;
/**
 * The two sizes the mark is drawn at, and the only two.
 *
 * The real sixty-strand mark holds down to about **28px**. Below that the
 * strands fall under a pixel, average together, and it rasterises as a soft
 * pink disc: legible as a circle, illegible as a wound one. That is the floor,
 * and it was found by rendering rather than assumed, because assuming it is
 * higher costs the logo its own artwork at every size that matters.
 *
 * So `full` is used wherever the mark is 28px or larger, which is everywhere it
 * is a logo: the hero, the header, the link preview and every icon but one.
 * `dot` exists for the sizes a logo never appears at and a bullet does.
 *
 * A middle variant was tried and removed. At 20px it is a bold scribble, which
 * reads as a different, cruder mark rather than as the logo, and the honest
 * choices at that size are to make the mark bigger or to accept that it is a
 * marker and not a logo.
 *
 * `dot` is the FIRST eight strands of the same seeded sequence, so it is the
 * logo thinned and not a second drawing. Below about 13px nothing reads as a
 * sphere and the mark should be a plain dot.
 *
 * `weight` multiplies the stroke widths. It is in mark units, not pixels, so it
 * does NOT hold a stroke at a constant pixel width as the mark scales: the
 * logo's own weight at 16px is a fifth of a pixel and renders as a smudge. Each
 * band's weight is tuned by eye at that band's own size.
 *
 * Scaling the full sixty strands down to bullet size instead was tried, both as
 * vector and as a supersampled raster, and does not work at any weight. Thin
 * enough not to fill in, the strokes fall under a pixel and the mark is a pale
 * disc; thick enough to see, it is a solid one. The winding needs space between
 * strands, and at 16px there is space for about eight.
 */
export const VARIANTS = {
  /**
   * 13 to 20px: list markers and inline separators.
   *
   * Eight strands. Fewer, around four, is a circle with a couple of chords
   * across it, which reads as a slashed circle, a "no" sign. More, around
   * twelve, and the strands close into a textured disc. Eight is the count with
   * visible space between the windings at 16px, which is what says "wound".
   */
  dot: { count: 8, weight: 6, steps: 70, flat: true },
  /** 28px and up: every place the mark is the logo. */
  full: { count: STRANDS, weight: 1, steps: 110, flat: false },
  /**
   * The same sixty strands as `full`, inked heavier for small rasters.
   *
   * Not a different drawing: the icons are the logo. But the logo's hairline is
   * a third of a pixel at 32px, and a third of a pixel is a third of the
   * accent's strength, so the tab icon comes out as a pale disc while the same
   * file at 512px is perfect. Thickening the stroke as the mark shrinks is the
   * design system's reproduction floor, and this is it applied to the one
   * artwork that has to survive being rasterised at 32px.
   */
  icon: { count: STRANDS, weight: 3, steps: 110, flat: false },
};

/**
 * The mark's drawn ink extent against its nominal 176-unit diameter.
 *
 * The wobble pushes strands past the nominal circle and the round caps add half
 * a stroke on top, so the ink runs 3% wider. Every asset is cropped to the ink,
 * and the brand package's layout numbers are all nominal, so anything sized or
 * spaced against the spec has to convert between the two.
 */
export const INK_RATIO = 181.235 / 176;

/** The circle's nominal diameter, in cap heights, and the bar's height with it. */
export const DIAMETER_CAPS = 1.34;

/** @typedef {keyof typeof VARIANTS} Variant */

const MAX_OFFSET = 0.55; // max plane offset from centre, as a fraction of R
const WOBBLE = 0.035; // radial wobble amplitude
/**
 * Samples per strand. 180 is the reference value and the one the check asserts.
 * Sampling consumes no randomness, so a lower count is the same curve drawn
 * coarser, not a different one: at 96 the chord sits 0.05 units off the true
 * arc inside a 181-unit mark, which is a fortieth of a stroke width. Assets
 * that ship as bytes take the lower count; the check takes 180.
 */
export const STEPS = 180;
const Z_SPLIT = 0.38; // |z|/R boundary between depth buckets

/** Stroke width and opacity per depth bucket: back, middle, front. */
export const STROKE = [0.75, 0.95, 1.15];
export const OPACITY = [0.38, 0.95, 1.0];

/*
 * Two different truncations of 2*pi, both carried over from the reference
 * build. The sweep uses 6.283185 and the wobble phases use 6.283, and they are
 * not interchangeable: collapsing them to one constant, or to a real 2*pi,
 * moves every strand. They are part of the drawing, not a rounding to tidy up.
 */
const SWEEP = 6.283185;
const PHASE = 6.283;

/**
 * @typedef {{ x: number, y: number, z: number }} Point
 * @typedef {Point[]} Strand a closed loop of samples, in sphere space
 */

/**
 * The seeded strand geometry, in sphere space: origin at the centre, +y up, and
 * no projection applied yet. Rotating and projecting is `projectStrands`.
 *
 * @param {{ seed?: number, count?: number, steps?: number }} [options]
 * @returns {Strand[]}
 */
export function buildStrands({ seed = SEED, count = STRANDS, steps = STEPS } = {}) {
  const rnd = new PythonRandom(seed);
  /** @type {Strand[]} */
  const out = [];

  for (let s = 0; s < count; s += 1) {
    let nx = 0;
    let ny = 0;
    let nz = 0;
    // Redrawn on the vanishing chance of a zero-length normal, exactly as the
    // reference does, so the RNG stays in step.
    for (;;) {
      nx = rnd.gauss(0, 1);
      ny = rnd.gauss(0, 1);
      nz = rnd.gauss(0, 1);
      const length = Math.sqrt(nx * nx + ny * ny + nz * nz);
      if (length > 1e-6) {
        nx /= length;
        ny /= length;
        nz /= length;
        break;
      }
    }

    // How far the strand's plane sits off the sphere's centre, and therefore
    // how small the circle it cuts is.
    const d = R * MAX_OFFSET * (rnd.random() * 2 - 1);
    const r = Math.sqrt(Math.max(R * R - d * d, 1));

    // An orthonormal basis in that plane. The seed axis switches when the
    // normal is close to z, so the cross product never collapses.
    const [ax, ay, az] = Math.abs(nz) < 0.9 ? [0, 0, 1] : [1, 0, 0];
    let ux = ay * nz - az * ny;
    let uy = az * nx - ax * nz;
    let uz = ax * ny - ay * nx;
    const ulen = Math.sqrt(ux * ux + uy * uy + uz * uz);
    ux /= ulen;
    uy /= ulen;
    uz /= ulen;
    const vx = ny * uz - nz * uy;
    const vy = nz * ux - nx * uz;
    const vz = nx * uy - ny * ux;

    const ph1 = rnd.random() * PHASE;
    const ph2 = rnd.random() * PHASE;
    const a1 = rnd.uniform(0.5, 1.5);
    const a2 = rnd.uniform(0.3, 1.0);

    /** @type {Strand} */
    const strand = [];
    for (let i = 0; i <= steps; i += 1) {
      const t = (i / steps) * SWEEP;
      // The wobble is what stops sixty perfect circles reading as a wireframe.
      const rr = r * (1 + (WOBBLE * (a1 * Math.sin(3 * t + ph1) + a2 * Math.sin(5 * t + ph2))) / 2);
      const cos = Math.cos(t);
      const sin = Math.sin(t);
      strand.push({
        x: d * nx + rr * (cos * ux + sin * vx),
        y: d * ny + rr * (cos * uy + sin * vy),
        z: d * nz + rr * (cos * uz + sin * vz),
      });
    }
    out.push(strand);
  }
  return out;
}

/**
 * Rotates about the vertical axis and projects orthographically, then cuts each
 * strand at every depth-bucket boundary it crosses.
 *
 * The cut is the whole point of the buckets: a strand that passes behind the
 * sphere has to be drawn lighter and thinner for that stretch only, or the
 * sphere reads flat. The result is three lists of polylines, back first, so
 * nearer strands overprint farther ones.
 *
 * @param {Strand[]} strands from `buildStrands`
 * @param {number} [angle] radians about the y axis. 0 reproduces the logo.
 * @returns {[number, number][][][]} three buckets of polylines, back to front
 */
export function projectStrands(strands, angle = 0) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  /** @type {[number, number][][][]} */
  const buckets = [[], [], []];
  const split = Z_SPLIT * R;

  for (const strand of strands) {
    /** @type {[number, number][] | null} */
    let run = null;
    let runBucket = -1;

    for (const p of strand) {
      // Rotation is skipped rather than applied as an identity at angle 0, so
      // the static render is bit-for-bit the reference's arithmetic.
      const px = angle === 0 ? p.x : p.x * cos + p.z * sin;
      const pz = angle === 0 ? p.z : -p.x * sin + p.z * cos;
      const bucket = pz < -split ? 0 : pz > split ? 2 : 1;
      // y is flipped: SVG grows downward.
      /** @type {[number, number]} */
      const point = [CX + px, CY - p.y];

      if (bucket !== runBucket) {
        if (run && run.length > 1) buckets[runBucket].push(run);
        run = [point];
        runBucket = bucket;
      } else {
        run.push(point);
      }
    }
    if (run && run.length > 1) buckets[runBucket].push(run);
  }
  return buckets;
}

/**
 * The three `<path>` elements, back first.
 *
 * One coordinate decimal, matching the reference: at a 200-unit box that is
 * finer than any raster the mark is drawn into, and the tenth of a unit saved
 * per number is most of the file.
 *
 * The depth ramp is what keeps the sphere turning at size, and it is the first
 * thing to go below it. The design system's reproduction floor says to drop
 * every ramp under 72px and use the flat accent, and the reason is visible in a
 * 16px render: a back layer at 0.38 opacity lands on a pixel that is 38% of the
 * way to the paper, and the mark reads as faded rather than as far away. `flat`
 * is that rule. The depth split still sets the stroke widths, so the silhouette
 * keeps some of its weight.
 *
 * @param {[number, number][][][]} buckets
 * @param {string} colour a resolved value; this module states none
 * @param {number} [weight] multiplies every stroke width, for small sizes
 * @param {boolean} [flat] drop the opacity ramp, per the reproduction floor
 * @returns {string}
 */
export function globeSvg(buckets, colour, weight = 1, flat = false) {
  return buckets
    .map((bucket, depth) => {
      const d = bucket
        .map((run) => `M${run.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L')}`)
        .join('');
      return (
        `<path d="${d}" fill="none" stroke="${colour}" ` +
        `stroke-width="${(STROKE[depth] * weight).toFixed(2)}" ` +
        `stroke-linecap="round" stroke-linejoin="round" ` +
        `opacity="${(flat ? 1 : OPACITY[depth]).toFixed(2)}"/>`
      );
    })
    .join('');
}

/**
 * The true extent of the drawn ink, padded by half the widest stroke so round
 * caps are not clipped.
 *
 * The nominal circle is 176 wide inside the 200-unit box, but the wobble pushes
 * strands past that, so a crop measured against 176 shaves the silhouette. The
 * brand package's 25% margin is measured against this, not against the nominal
 * diameter.
 *
 * @param {[number, number][][][]} buckets
 * @returns {{ x: number, y: number, width: number, height: number }}
 */
export function inkBounds(buckets) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const bucket of buckets) {
    for (const run of bucket) {
      for (const [x, y] of run) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  const cap = Math.max(...STROKE) / 2;
  return {
    x: minX - cap,
    y: minY - cap,
    width: maxX - minX + cap * 2,
    height: maxY - minY + cap * 2,
  };
}

/**
 * The mark as a standalone `viewBox` and body, cropped to the ink and padded by
 * `margin` as a fraction of the ink width. The brand package's tight crop is
 * margin 0; its generous one is 0.25.
 *
 * @param {{ colour: string, count?: number, steps?: number, angle?: number, margin?: number, weight?: number }} options
 * @returns {{ viewBox: string, body: string, size: number }}
 */
export function globeArtwork({
  colour,
  count = STRANDS,
  steps = STEPS,
  angle = 0,
  margin = 0,
  weight = 1,
}) {
  const buckets = projectStrands(buildStrands({ count, steps }), angle);
  const ink = inkBounds(buckets);
  const pad = margin * ink.width;
  // Square, from the larger side, so the mark never comes out subtly oval.
  const size = Math.max(ink.width, ink.height) + pad * 2;
  const x = ink.x + ink.width / 2 - size / 2;
  const y = ink.y + ink.height / 2 - size / 2;
  return {
    viewBox: `${x.toFixed(3)} ${y.toFixed(3)} ${size.toFixed(3)} ${size.toFixed(3)}`,
    body: globeSvg(buckets, colour, weight),
    size,
  };
}

/**
 * The mark as a `<g>` normalised into a 100 x 100 box, ink-tight on the larger
 * axis and centred on the other.
 *
 * Normalising here is what lets an SVG template place the mark with a plain
 * `translate` and `scale` and never mention the ink bounds, which are an
 * awkward `9.254 9.246 181.235 181.261` and would otherwise have to be copied
 * into every template that used it and re-copied whenever the variant changed.
 *
 * @param {{ variant?: Variant, colour: string, steps?: number }} options
 * @returns {string}
 */
export function globeGroup({ variant = 'full', colour, steps }) {
  const { count, weight, steps: variantSteps, flat } = VARIANTS[variant];
  const buckets = projectStrands(buildStrands({ count, steps: steps ?? variantSteps }), 0);
  const ink = inkBounds(buckets);
  const span = Math.max(ink.width, ink.height);
  const scale = 100 / span;
  const x = -(ink.x + ink.width / 2) * scale + 50;
  const y = -(ink.y + ink.height / 2) * scale + 50;
  return (
    `<g transform="translate(${x.toFixed(4)} ${y.toFixed(4)}) scale(${scale.toFixed(6)})">` +
    `${globeSvg(buckets, colour, weight, flat)}</g>`
  );
}

/**
 * A standalone mark file: square, ink-tight, with an optional ground.
 *
 * Transparent by default. The brand package warns that a transparent export
 * carries the back layer's alpha, so on a dark ground those strands pick up
 * what is behind them; that is correct on this site, where the ground is always
 * paper, and it is why there is no baked dark variant here either.
 *
 * @param {{ variant?: Variant, colour: string, ground?: string | null, margin?: number, steps?: number, title: string }} options
 * @returns {string}
 */
export function markSvg({ variant = 'full', colour, ground = null, margin = 0, steps, title }) {
  const box = 100 + 200 * margin;
  const offset = (box - 100) / 2;
  const bg = ground
    ? `<rect width="${box.toFixed(3)}" height="${box.toFixed(3)}" fill="${ground}"/>`
    : '';
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${box.toFixed(3)} ${box.toFixed(3)}" ` +
    `role="img" aria-label="${title}"><title>${title}</title>${bg}` +
    `<g transform="translate(${offset.toFixed(3)} ${offset.toFixed(3)})">` +
    `${globeGroup({ variant, colour, steps })}</g></svg>`
  );
}
