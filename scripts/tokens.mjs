/**
 * The palette parser. `src/styles/global.css` states every colour once, as an
 * rgb triplet; this turns that block into values for the two contexts that
 * cannot resolve a CSS custom property on their own: a standalone SVG file,
 * which has no page to inherit from, and the `theme-color` meta tag, which
 * takes a literal.
 *
 * Pure on purpose. It takes the stylesheet as a string rather than reading it,
 * so the same function serves a Node build script (which reads the file) and an
 * Astro component (which imports it with Vite's `?raw`). An earlier version
 * read the file itself and broke the build the moment the bundler moved the
 * module: a path relative to the source tree does not survive being emitted
 * into dist/.
 */

/**
 * Every `rgb-` prefixed token, keyed without the prefix.
 * @param {string} css contents of src/styles/global.css
 * @returns {Record<string, string>} e.g. `{ accent: '166 129 58' }`
 */
export function parseTriplets(css) {
  const triplets = Object.fromEntries(
    [...css.matchAll(/--rgb-([a-z0-9-]+):\s*([\d\s]+?);/g)].map(([, name, value]) => [
      name,
      value.trim(),
    ]),
  );
  if (Object.keys(triplets).length === 0) {
    throw new Error('No rgb tokens found in the stylesheet. Has the token block moved or renamed?');
  }
  return triplets;
}

/** A triplet as a hex string: `'10 20 30'` becomes `'#0a141e'`. */
export function toHex(triplet) {
  return `#${triplet
    .split(/\s+/)
    .map((channel) => Number(channel).toString(16).padStart(2, '0'))
    .join('')}`;
}

/**
 * Every token as a hex string.
 * @param {string} css contents of src/styles/global.css
 * @returns {Record<string, string>} token name to hex string
 */
export function paletteFrom(css) {
  return Object.fromEntries(
    Object.entries(parseTriplets(css)).map(([name, triplet]) => [name, toHex(triplet)]),
  );
}
