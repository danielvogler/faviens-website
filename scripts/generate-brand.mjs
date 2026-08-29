/**
 * Off-site brand assets: the logo files uploaded to Google Workspace, LinkedIn
 * and anywhere else that asks for one. Reads the same palette and the same
 * letterforms as the site, so a profile picture cannot drift from the page it
 * points at.
 *
 * Not part of the site build. `generate-og.mjs` runs on predev and prebuild
 * because the browser fetches what it writes; nothing fetches these, so this
 * runs by hand, with `pnpm brand`, when a logo is actually needed.
 *
 * Output goes to `brand/`, which is gitignored: these are binaries, and the
 * repository keeps none. Regenerate rather than archive.
 *
 * Every size here is a published requirement of the destination, not a
 * preference. See the table in TARGETS.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { paletteFrom } from './tokens.mjs';
import { renderTight, resolveSource } from './tight-render.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const brandDir = join(__dirname, '..', 'brand');
const sourceDir = join(__dirname, 'assets');
const stylesheet = join(__dirname, '..', 'src', 'styles', 'global.css');

const palette = paletteFrom(await readFile(stylesheet, 'utf8'));

/**
 * `ground: null` leaves the PNG transparent. Workspace sets the logo on its own
 * white chrome, where a near-white tile would read as a grey rectangle, so that
 * one is transparent and carries no ground of its own. LinkedIn renders the
 * same avatar on a light card and on a dark one, so that one keeps the paper
 * tile: transparent there would leave ink letters invisible in dark mode.
 *
 * `margin` is the share of the shorter side left empty on each edge. Small on
 * purpose. The complaint that started this file was that the existing icons sit
 * in a field of dead space, which is what happens when a mark is centred in a
 * tile sized for something else instead of being measured and then padded.
 */
const TARGETS = [
  {
    file: 'faviens-workspace-320x132.png',
    source: 'brand-wordmark.svg',
    width: 320,
    height: 132,
    ground: null,
    margin: 0.04,
    // Google caps this one at 30 KB and resizes anything that is not 320x132.
    maxBytes: 30 * 1024,
  },
  {
    file: 'faviens-linkedin-400x400.png',
    source: 'brand-mark-fav.svg',
    width: 400,
    height: 400,
    ground: 'paper',
    margin: 0.1,
  },
  {
    file: 'faviens-linkedin-400x400-stacked.png',
    source: 'brand-mark-stack.svg',
    width: 400,
    height: 400,
    ground: 'paper',
    margin: 0.09,
  },
  {
    file: 'faviens-linkedin-400x400-single-letter.png',
    source: 'brand-mark-f.svg',
    width: 400,
    height: 400,
    ground: 'paper',
    margin: 0.12,
  },
];

/** Renders one target and enforces whatever size cap the destination imposes. */
async function renderTarget({ file, source, width, height, ground, margin, maxBytes }) {
  const svg = await resolveSource(sourceDir, source, palette);
  const png = await renderTight(svg, {
    width,
    height,
    ground: ground ? palette[ground] : null,
    margin,
  });

  await writeFile(join(brandDir, file), png);

  if (maxBytes && png.byteLength > maxBytes) {
    throw new Error(
      `${file} is ${png.byteLength} bytes, over the ${maxBytes} the destination accepts.`,
    );
  }
  console.log(`${file} generated (${width}x${height}, ${png.byteLength} bytes)`);
}

await mkdir(brandDir, { recursive: true });
for (const target of TARGETS) {
  await renderTarget(target);
}
