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
import { mkdir, readdir, readFile, unlink, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { paletteFrom } from './tokens.mjs';
import { resolveSource } from './template.mjs';
import { fitInto, hexToRgb } from './tight-render.mjs';
import { horizontalLockup, lockupBlock, stackedLockup } from './lockup.mjs';
import { photoBanner } from './photo-banner.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const brandDir = join(__dirname, '..', 'brand');
const sourceDir = join(__dirname, 'assets');
const stylesheet = join(__dirname, '..', 'src', 'styles', 'global.css');

const palette = paletteFrom(await readFile(stylesheet, 'utf8'));
const wordmark = await resolveSource(sourceDir, 'brand-wordmark.svg', palette);
const mark = await resolveSource(sourceDir, 'brand-mark.svg', palette);
const descriptor = await resolveSource(sourceDir, 'descriptor.svg', palette);

/**
 * `ground: null` leaves the PNG transparent. Workspace sets the logo on its own
 * white chrome, where a near-white tile would read as a grey rectangle, so that
 * one is transparent and carries no ground of its own. LinkedIn renders the
 * same avatar on a light card and on a dark one, so those keep the paper tile:
 * transparent there would leave ink letters invisible in dark mode.
 *
 * `margin` is the share of the shorter side left empty on each edge. Small on
 * purpose. The complaint that started this file was that the existing icons sit
 * in a field of dead space, which is what happens when a mark is centred in a
 * tile sized for something else instead of being measured and then padded.
 *
 * `lockup` picks the composition. `horizontal` is the logo, and it is what goes
 * anywhere wide. `stacked` exists for the square tiles: the horizontal lockup
 * is about six to one, so in a square frame it letterboxes to most of the tile
 * empty however small the margin is set. `mark` is the circle alone, which is
 * the right avatar wherever the name is already printed beside it, which on
 * LinkedIn it always is.
 *
 * Every size here is a published requirement of the destination, not a
 * preference.
 */
const TARGETS = [
  {
    file: 'faviens-workspace-320x132.png',
    lockup: 'horizontal',
    width: 320,
    height: 132,
    ground: null,
    margin: 0.04,
    // Google caps this one at 30 KB and resizes anything that is not 320x132.
    maxBytes: 30 * 1024,
  },
  {
    file: 'faviens-linkedin-400x400.png',
    lockup: 'mark',
    width: 400,
    height: 400,
    ground: 'paper',
    margin: 0.08,
  },
  {
    file: 'faviens-linkedin-400x400-stacked.png',
    lockup: 'stacked',
    width: 400,
    height: 400,
    ground: 'paper',
    margin: 0.09,
  },
  {
    file: 'faviens-linkedin-cover-1128x191.png',
    banner: { blockHeight: 62, align: 'left', inset: 300 },
    width: 1128,
    height: 191,
    ground: 'paper',
  },
  {
    file: 'faviens-linkedin-banner-1584x396.png',
    banner: { blockHeight: 104, align: 'right', inset: 120 },
    width: 1584,
    height: 396,
    ground: 'paper',
  },
];

/**
 * A banner is placed, not fitted. The other targets centre a mark in a tile;
 * these have to keep clear of what LinkedIn draws on top of them, so the block
 * is anchored to one side with a stated inset instead.
 *
 * Company page cover, 1128x191: the square logo tile is overlaid at the bottom
 * LEFT, so the block starts to the right of it.
 *
 * Personal profile banner, 1584x396: the profile photo is overlaid at the
 * bottom left and the frame is cropped tighter on a phone, so the block is
 * anchored right and kept on the vertical centre line, which survives both.
 *
 * Both sizes are LinkedIn's published ones. They have been stable for years but
 * they are LinkedIn's to change, so check them before a re-upload matters.
 */
async function renderBanner({ width, height, ground, banner }) {
  const block = await lockupBlock({
    wordmark,
    mark,
    descriptor,
    height: banner.blockHeight,
    // A quarter of the lockup's height, which is the same ratio the link
    // preview uses, so the line sits the same distance under the mark
    // everywhere it appears.
    gap: Math.round(banner.blockHeight * 0.23),
  });
  const left = banner.align === 'right' ? width - banner.inset - block.width : banner.inset;

  return sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { ...hexToRgb(palette[ground]), alpha: 1 },
    },
  })
    .composite([{ input: block.data, left, top: Math.round((height - block.height) / 2) }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/** The composed artwork, cropped to its ink, before any ground or margin. */
async function compose(lockup) {
  if (lockup === 'mark') {
    return sharp(Buffer.from(mark), { density: 1200 }).trim({ threshold: 1 }).png().toBuffer();
  }
  // A generous working size: the parts are measured and composed here, then
  // scaled once into the destination's box, so this only has to be larger than
  // any target rather than equal to one.
  const build =
    lockup === 'stacked'
      ? await stackedLockup({ wordmark, mark, width: 1200 })
      : await horizontalLockup({ wordmark, mark, height: 400 });
  return build.data;
}

/** Renders one target and enforces whatever size cap the destination imposes. */
async function renderTarget(target) {
  const { file, lockup, width, height, ground, margin, maxBytes, banner } = target;
  const png = banner
    ? await renderBanner(target)
    : await fitInto(await compose(lockup), {
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
  console.log(
    `${file} generated (${lockup ?? 'banner'}, ${width}x${height}, ${png.byteLength} bytes)`,
  );
}

/**
 * Removes outputs this script no longer produces.
 *
 * `brand/` is gitignored, so a target that is dropped from the list leaves its
 * last render sitting there indefinitely, with nothing to show it is stale.
 * That is how an avatar carrying the previous identity survived the switch to
 * the new one and was still there to be uploaded. A regenerated directory is
 * the whole premise of this file, so it may as well be true.
 *
 * Scoped to the `faviens-*.png` names this script writes, and it says what it
 * removed, so anything else left in the directory by hand is untouched.
 */
async function pruneStale(current) {
  const existing = await readdir(brandDir).catch(() => []);
  for (const file of existing) {
    if (!/^faviens-.*\.png$/.test(file) || current.has(file)) continue;
    await unlink(join(brandDir, file));
    console.log(`${file} removed (no longer a target)`);
  }
}

/*
 * The photo banners, rendered only when a photograph is pointed at.
 *
 *   FAVIENS_PHOTO=~/pictures/alps.jpg pnpm brand
 *
 * The source image is not in the repository and should not be: it is a binary,
 * and this one is several megabytes. Naming it on the command line keeps it
 * wherever the maintainer actually keeps photographs, and means these targets
 * simply do not run when there is nothing to run them on.
 *
 * `horizon` is where the skyline sits in the photo and has to be measured for
 * each one, by eye or by looking for the row where variance jumps. `horizonAt`
 * is where it should sit in the output. Stated that way, one setting composes
 * the 4:1 banner and the 5.9:1 cover identically; a fixed crop does not, and
 * loses the subject entirely from the narrower of the two.
 */
const PHOTO = process.env.FAVIENS_PHOTO;
const PHOTO_TARGETS = [
  {
    file: 'faviens-photo-banner-1584x396.png',
    width: 1584,
    height: 396,
    blockHeight: 104,
    inset: 110,
  },
  {
    file: 'faviens-photo-cover-1128x191.png',
    width: 1128,
    height: 191,
    blockHeight: 62,
    inset: 80,
  },
];
const PHOTO_SETTINGS = {
  treatment: process.env.FAVIENS_PHOTO_TREATMENT ?? 'light',
  horizon: Number(process.env.FAVIENS_PHOTO_HORIZON ?? 0.7),
  horizonAt: Number(process.env.FAVIENS_PHOTO_HORIZON_AT ?? 0.62),
};

async function renderPhotoTargets() {
  if (!PHOTO) {
    console.log('FAVIENS_PHOTO not set, skipping the photo banners');
    return;
  }
  for (const target of PHOTO_TARGETS) {
    const r = await photoBanner({ photo: PHOTO, align: 'right', ...PHOTO_SETTINGS, ...target });
    await writeFile(join(brandDir, target.file), r.data);
    console.log(
      `${target.file} generated (${target.width}x${target.height}, veil ${(r.alpha * 100).toFixed(0)}%, ` +
        `letters ${r.letters.toFixed(1)}:1, accent ${r.accent.toFixed(1)}:1, ${r.data.length} bytes)`,
    );
  }
}

await mkdir(brandDir, { recursive: true });
// The photo banners count as current whenever a photo is supplied, and are left
// alone when one is not: a run without FAVIENS_PHOTO should not delete banners a
// previous run with it produced.
await pruneStale(
  new Set([...TARGETS.map((target) => target.file), ...PHOTO_TARGETS.map((target) => target.file)]),
);
for (const target of TARGETS) {
  await renderTarget(target);
}
await renderPhotoTargets();
