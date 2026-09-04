#!/usr/bin/env node
/**
 * Asserts that `src/lib/globe.mjs` still draws the logo.
 *
 * The mark on this site is generated, not pasted in, because the background
 * field has to turn the sphere and a flattened SVG has no depth left to turn.
 * That freedom is only safe while the generator's output at rest is the same
 * drawing as the brand package's `logo/faviens-circle.svg`, which is the
 * artwork of record. This is what makes that a build failure rather than a
 * slow drift nobody notices until a printed card disagrees with the website.
 *
 * A digest rather than the artwork: the reference is 131 KB of coordinates, and
 * the repository keeps no binaries or duplicated assets. The digest is taken
 * over the three `<path>` elements with a placeholder in place of the colour,
 * so a palette change does not trip it and a geometry change always does.
 *
 * If this fails and the change was deliberate, regenerate the logo files from
 * the brand package first and update the digest with them, in that order. The
 * committed artwork wins over this file, never the other way round.
 */
import { createHash } from 'node:crypto';
import { buildStrands, globeSvg, projectStrands, inkBounds } from '../src/lib/globe.mjs';

/** sha256 of `globeSvg(projectStrands(buildStrands()), 'REF')`, verified byte
 *  for byte against logo/faviens-circle.svg from the brand package. */
const EXPECTED = '5329d85ba153c543a88f396d83c61e9d2e47e784a3e9905b2a5979b1520ce938';

/** The mark's true ink extent, to three decimals, as the spec records it. */
const EXPECTED_BOUNDS = '9.254 9.246 181.235 181.261';

const buckets = projectStrands(buildStrands(), 0);
const digest = createHash('sha256').update(globeSvg(buckets, 'REF')).digest('hex');

const ink = inkBounds(buckets);
const bounds = [ink.x, ink.y, ink.width, ink.height].map((n) => n.toFixed(3)).join(' ');

const failures = [];
if (digest !== EXPECTED) {
  failures.push(`  strand geometry changed\n    expected ${EXPECTED}\n    got      ${digest}`);
}
if (bounds !== EXPECTED_BOUNDS) {
  failures.push(`  ink extent changed\n    expected ${EXPECTED_BOUNDS}\n    got      ${bounds}`);
}

if (failures.length > 0) {
  console.error('globe: does not match the artwork of record\n' + failures.join('\n'));
  process.exit(1);
}
console.log('globe: matches the artwork of record');
