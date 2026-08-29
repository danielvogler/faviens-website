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
 *     their own Gmail settings, and it carries a name and a role and nothing
 *     else. Everything about the company arrives from the append footer, which
 *     every account already gets, so restating any of it here would print it
 *     twice in any email with nothing quoted underneath.
 *
 * Neither carries a real name. The signature marks the two lines to replace;
 * the append footer has no name in it at all, by Google's construction.
 *
 * Not an image. A signature rendered as a picture is unselectable, unclickable,
 * and blank in every client that blocks remote images by default, which is most
 * corporate ones. The mark survives that perfectly well as live text: it is the
 * word set bold with two letters in the accent, and any mail client can draw
 * that. Nothing here needs to be fetched to render.
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

/** The two letters that carry the device, by index in the name. */
const ACCENT_LETTERS = new Set(['A', 'I']);

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

/** The wordmark as live text: every letter in ink, the A and the I in the
 *  accent. Built per letter rather than written out so the device cannot drift
 *  from the one the site draws. */
function wordmark(name, palette) {
  return [...name.toUpperCase()]
    .map((letter) => {
      const colour = ACCENT_LETTERS.has(letter) ? palette.accent : palette.ink;
      return `<span style="color:${colour}">${letter}</span>`;
    })
    .join('');
}

function escapeHtml(value) {
  return value.replace(
    /[&<>"]/g,
    (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[character],
  );
}

const palette = paletteFrom(await readFile(join(root, 'src', 'styles', 'global.css'), 'utf8'));
const company = await readFile(join(root, 'src', 'data', 'company.ts'), 'utf8');
const email = readField(company, 'src/data/company.ts', 'email');

/* The location in English, taken from the string the site's own English footer
   renders, so the two cannot disagree. */
const english = await readFile(join(root, 'src', 'i18n', 'en.ts'), 'utf8');
const location = readField(english, 'src/i18n/en.ts', 'location');

/*
 * Tables and inline styles, not flexbox and a stylesheet. Mail clients strip
 * <style> blocks and several still lay out with a table engine from before CSS
 * layout existed, so this is the shape that survives being pasted into Gmail,
 * Outlook and Apple Mail alike.
 *
 * `accent-d` rather than `accent` for the link: the palette reserves the darker
 * accent for type under 18px, and every line here is under it.
 */
const html = `<!-- GENERATED by scripts/generate-signature.mjs. Edit that script, not this file. -->
<!-- Open this file in a browser, select all, copy, and paste into the Gmail
     signature box. Then replace the two lines marked below with your own.

     Name and role only, deliberately. The mark, the address and the company
     lines all arrive from the org-wide append footer, which every account gets
     without doing anything. Repeating them here would print the mark twice in
     any email with nothing quoted under it, which is every first email. -->
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;font-family:${FONT_STACK};font-size:14px;line-height:1.45;color:${palette.ink}">
  <tr>
    <td style="padding:0 0 2px 0;font-weight:600">${escapeHtml(EXAMPLE_NAME)}</td><!-- replace -->
  </tr>
  <tr>
    <td style="padding:0;color:${palette.grey}">${escapeHtml(EXAMPLE_ROLE)}</td><!-- replace -->
  </tr>
</table>
`;

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
const uid = readOptional(company, 'uid');
const footerLines = [location, `${email} | https://faviens.com`, uid ? `UID ${uid}` : null].filter(
  Boolean,
);

await mkdir(docsDir, { recursive: true });
await writeFile(join(docsDir, 'email-signature.html'), html);
await writeFile(join(docsDir, 'email-footer.txt'), `${footerLines.join('\n')}\n`);
console.log('docs/email-signature.html generated');
console.log('docs/email-footer.txt generated');
