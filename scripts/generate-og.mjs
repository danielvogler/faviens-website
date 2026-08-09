/**
 * Build-time image generation. Rasterises the committed SVG sources into the
 * PNG variants referenced by BaseHead.astro, so no binaries live in git.
 * Runs automatically via the `prebuild` npm script.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

const OG_SIZE = { width: 1200, height: 630 };
const FAVICON_SIZES = [
  { file: 'favicon-16x16.png', size: 16 },
  { file: 'favicon-32x32.png', size: 32 },
  { file: 'favicon-512x512.png', size: 512 },
  { file: 'apple-touch-icon.png', size: 180 },
];

async function render(sourceFile, targetFile, { width, height }) {
  const svg = await readFile(join(publicDir, sourceFile));
  const png = await sharp(svg).resize(width, height).png({ quality: 90 }).toBuffer();
  await writeFile(join(publicDir, targetFile), png);
  console.log(`${targetFile} generated (${png.byteLength} bytes)`);
}

await render('og.svg', 'og.png', OG_SIZE);

for (const { file, size } of FAVICON_SIZES) {
  await render('favicon.svg', file, { width: size, height: size });
}
