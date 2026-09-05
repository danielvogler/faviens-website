/**
 * The two halves of the company email footer, generated into `docs/` and tracked, so everyone takes
 * the same ones from the repository rather than each person rebuilding them and
 * the mark drifting a little further every time.
 *
 * There are two because Google Workspace splits the job in half and gives us no
 * say in it:
 *
 *   - `email-footer.txt` is the org-wide append footer, set once by an admin
 *     under Gmail's Compliance settings. It cannot be personalised: the setting
 *     takes no per-user variables, so a name can never appear in it. It also
 *     takes no HTML, only the editor's own formatting, which is why this one is
 *     plain text.
 *   - `email-signature.html` is the per-person signature each user pastes into
 *     their own Gmail settings. It is the complete footer: name, role, the
 *     mark, and the company lines.
 *
 * Because it is complete, it REPLACES the append footer rather than sitting
 * under it. Running both prints the company block twice in any email with
 * nothing quoted underneath, which is every first email. The plain-text footer
 * is still generated, for a Workspace that would rather set one thing centrally
 * than have everyone paste one; pick one of the two, not both.
 *
 * Neither carries a real name. The signature marks the two lines to replace;
 * the append footer has no name in it at all, by Google's construction.
 *
 * Type first, one image. Everything a recipient needs to act on, the name, the
 * role, the address and the link, is live text: selectable, clickable, and
 * present in the clients that block remote images by default, which is most
 * corporate ones. Only the mark is an image, because it cannot be anything
 * else: sixty hairline paths and a bar standing in for a letter do not survive
 * a mail client's HTML subset. It carries an alt of the name, so a blocked
 * image degrades to the word rather than to a broken tile.
 *
 * Colours and the contact address are read from the same files the site reads,
 * so a palette change or a change of address moves the signature with it.
 *
 * Usage:
 *   pnpm signature
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { paletteFrom } from './tokens.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const docsDir = join(root, 'docs');

/** Archivo will not load in a mail client, so the stack falls to the same
 *  grotesques the site names after it. The mark is weight and colour, not the
 *  face, so it survives the substitution. */
const FONT_STACK = "Archivo, 'Helvetica Neue', Helvetica, Arial, sans-serif";

/*
 * The hosted mark, at half its pixel size, so it stays sharp on a retina
 * screen. It is the one asset here that has to be fetched, and the one that
 * cannot be drawn in HTML.
 */
const LOGO = { width: 210, height: 39 };

/* The signature carries a `paper` ground. The wordmark is inked in `ink`, so
   with no ground of its own a dark client renders it, and the type beside it,
   near-black on near-black. The logo has to carry the same ground, which is why
   this is the paper PNG and not the transparent one. */
const SIGNATURE = { file: 'email-signature.html', logo: 'email-logo-paper.png', ground: 'paper' };

/* Placeholders, deliberately not anyone's. Whoever pastes the signature replaces
   the two marked lines in their own mail client, which is a one-off edit per
   person and keeps every real name out of the repository. */
const EXAMPLE_NAME = 'Firstname Lastname';
const EXAMPLE_ROLE = 'Role';

/** Pulls a single-quoted string field out of a TS source file, so the address
 *  and the site are stated once each and read from where they already live. */
function readField(source, file, field) {
  const match = source.match(new RegExp(`${field}:\\s*'([^']+)'`));
  if (!match) {
    throw new Error(`Could not find \`${field}\` in ${file}. Has the shape of that file changed?`);
  }
  return match[1];
}

/** Same, for a field that is `null` until the registration comes through. A
 *  missing field is an error; a field that is explicitly null is not. */
function readOptional(source, field) {
  const match = source.match(new RegExp(`${field}:\\s*'([^']+)'`));
  return match ? match[1] : null;
}

function escapeHtml(value) {
  return value.replace(
    /[&<>"]/g,
    (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[character],
  );
}

const palette = paletteFrom(await readFile(join(root, 'src', 'styles', 'global.css'), 'utf8'));

/*
 * The origin, read from the one place that defines it. `astro.config.mjs` sets
 * `site` from SITE_URL with a literal fallback, and the sitemap and every
 * canonical URL come from there; writing it out again here would be a second
 * fallback that drifts from the first the day the domain changes.
 */
const astroConfig = await readFile(join(root, 'astro.config.mjs'), 'utf8');
const originMatch = astroConfig.match(/process\.env\.SITE_URL \|\| '([^']+)'/);
if (!originMatch) {
  throw new Error('Could not find the `site` fallback in astro.config.mjs. Has its shape changed?');
}
const origin = originMatch[1];
const company = await readFile(join(root, 'src', 'data', 'company.ts'), 'utf8');
const email = readField(company, 'src/data/company.ts', 'email');

/* The location in English, taken from the string the site's own English footer
   renders, so the two cannot disagree. */
const english = await readFile(join(root, 'src', 'i18n', 'en.ts'), 'utf8');
const location = readField(english, 'src/i18n/en.ts', 'location');

const uidLine = readOptional(company, 'uid');

/** The paste instructions. */
const PASTE_NOTE = `<!-- Open this file in a browser, select all, copy, and paste into the Gmail
     signature box. Then replace the two lines marked below with your own.

     This is the whole footer: name, role, mark and company lines. It REPLACES
     the org-wide append footer rather than sitting under it. Running both
     prints the company block twice in any email with nothing quoted
     underneath, which is every first email. -->`;

/**
 * Tables and inline styles, not flexbox and a stylesheet. Mail clients strip
 * <style> blocks and several still lay out with a table engine from before CSS
 * layout existed, so this is the shape that survives being pasted into Gmail,
 * Outlook and Apple Mail alike.
 *
 * `accent-d` rather than `accent` for the link: the palette reserves the darker
 * accent for type under 18px, and every line here is under it.
 */
function signatureTable(logo) {
  return `<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;font-family:${FONT_STACK};font-size:14px;line-height:1.45;color:${palette.ink}">
  <tr>
    <td style="padding:0 0 2px 0;font-weight:600">${escapeHtml(EXAMPLE_NAME)}</td><!-- replace -->
  </tr>
  <tr>
    <td style="padding:0 0 14px 0;color:${palette.grey}">${escapeHtml(EXAMPLE_ROLE)}</td><!-- replace -->
  </tr>
  <tr>
    <!-- A hairline, the same rule the site sets its sections on. A border on a
         cell rather than an <hr>, which Outlook draws with its own margins and
         its own colour. -->
    <td style="padding:14px 0 0 0;border-top:1px solid ${palette.hair}">
      <!-- width and height as attributes as well as in the style: Outlook
           ignores CSS dimensions on an image and will otherwise draw it at its
           full 420px. -->
      <a href="${origin}" style="text-decoration:none"><img src="${origin}/${logo}" width="${LOGO.width}" height="${LOGO.height}" alt="Faviens" style="display:block;width:${LOGO.width}px;height:${LOGO.height}px;border:0;outline:none;text-decoration:none"></a>
    </td>
  </tr>
  <tr>
    <td style="padding:10px 0 0 0;color:${palette.grey};font-size:13px">${escapeHtml(location)}</td>
  </tr>
  <tr>
    <td style="padding:2px 0 0 0;font-size:13px">
      <a href="mailto:${email}" style="color:${palette['accent-d']};text-decoration:none">${email}</a>
      <span style="color:${palette.hair}">&nbsp;|&nbsp;</span>
      <a href="${origin}" style="color:${palette['accent-d']};text-decoration:none">${origin.replace(/^https?:\/\//, '')}</a>
    </td>
  </tr>${
    uidLine
      ? `
  <tr>
    <td style="padding:2px 0 0 0;color:${palette.grey};font-size:12px">UID ${escapeHtml(uidLine)}</td>
  </tr>`
      : ''
  }
</table>`;
}

/* `bgcolor` as well as `background-color`, on the table and on its cell: Outlook's
   Word engine reads only the attribute, clients disagree about which element
   carries it, and an explicit background is what stops Gmail and Outlook.com
   inverting the block in dark mode. Padding on the cell, which Gmail keeps and
   drops on a table. */
const CARD_PADDING = '18px 22px';

function wrapInGround(block, ground) {
  const indented = block.replace(/\n/g, '\n      ');
  return `<table cellpadding="0" cellspacing="0" border="0" bgcolor="${ground}" style="border-collapse:collapse;background-color:${ground};color-scheme:light;supported-color-schemes:light">
  <tr>
    <td bgcolor="${ground}" style="background-color:${ground};padding:${CARD_PADDING}">
      ${indented}
    </td>
  </tr>
</table>`;
}

/** One complete file: the generated banner, the paste note, and the block. */
function signatureFile({ logo, ground }) {
  return `<!-- GENERATED by scripts/generate-signature.mjs. Edit that script, not this file. -->
${PASTE_NOTE}

${wrapInGround(signatureTable(logo), palette[ground])}
`;
}

/*
 * The append footer, plain text, sitting under the hosted wordmark that the
 * admin console inserts above it. The company name is not repeated here: the
 * image already says it. The cost is that a recipient whose client blocks
 * remote images, which is most corporate ones, sees a footer that names a city
 * and an address but not the company.
 *
 * The UID is left out until it exists rather than printed empty. Re-run this
 * once the registration lands and `uid` in company.ts stops being null.
 */
const footerLines = [location, `${email} | ${origin}`, uidLine ? `UID ${uidLine}` : null].filter(
  Boolean,
);

await mkdir(docsDir, { recursive: true });
await writeFile(join(docsDir, SIGNATURE.file), signatureFile(SIGNATURE));
console.log(`docs/${SIGNATURE.file} generated (${SIGNATURE.ground} ground)`);
await writeFile(join(docsDir, 'email-footer.txt'), `${footerLines.join('\n')}\n`);
console.log('docs/email-footer.txt generated');
