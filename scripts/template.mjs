/**
 * The SVG template resolver, shared by the two image scripts.
 *
 * A template names colours and marks by placeholder rather than carrying them:
 *
 *   {{token}}        an --rgb-* token from src/styles/global.css
 *   {{globe:NAME}}   a variant of the mark from src/lib/globe.mjs, as a <g>
 *                    normalised into a 100 x 100 box
 *
 * Both throw on an unknown name rather than leaving the placeholder in place. A
 * `{{accent}}` that silently survives into a rasterised PNG is a black
 * rectangle nobody notices until the image is already out in the world.
 *
 * It lives in its own file because both `generate-og.mjs` and
 * `generate-brand.mjs` resolve templates and only one of them rasterises
 * tightly. Keeping the resolver next to the rasteriser meant one of the two
 * quietly grew its own copy, and the copies then disagreed about which
 * placeholders existed.
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { globeGroup, VARIANTS } from '../src/lib/globe.mjs';

const PLACEHOLDER = /\{\{([a-z0-9-]+)(?::([a-z]+))?\}\}/g;

/**
 * @param {string} template the template source
 * @param {Record<string, string>} palette token name to hex, from tokens.mjs
 * @param {string} file the template's name, for error messages
 * @returns {string}
 */
export function resolveTemplate(template, palette, file) {
  return template.replace(PLACEHOLDER, (_, token, variant) => {
    if (token === 'globe') {
      if (!VARIANTS[variant]) {
        throw new Error(
          `${file} references {{globe:${variant}}}, which is not a variant in src/lib/globe.mjs. ` +
            `Known variants: ${Object.keys(VARIANTS).join(', ')}`,
        );
      }
      return globeGroup({ variant, colour: palette.accent });
    }
    const value = palette[token];
    if (!value) {
      throw new Error(
        `${file} references {{${token}}}, which is not a --rgb-* token in src/styles/global.css. ` +
          `Known tokens: ${Object.keys(palette).join(', ')}`,
      );
    }
    return value;
  });
}

/** Reads a template from `sourceDir` and resolves it. */
export async function resolveSource(sourceDir, file, palette) {
  return resolveTemplate(await readFile(join(sourceDir, file), 'utf8'), palette, file);
}
