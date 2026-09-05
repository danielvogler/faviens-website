# AGENTS.md

Working notes for coding agents and new contributors on the Faviens website.
Read this before making changes.

## What this is

A static, bilingual (DE / EN) site built with Astro 6 and Tailwind CSS 4,
deployed by GitHub Actions to GitHub Pages behind the custom domain
`faviens.com`. No client-side framework, no third-party tracking, self-hosted
fonts.

Faviens is an agentic-AI consultancy in Zurich. The site is currently a
placeholder: one page per locale, no content collections yet. The component and
i18n scaffolding is in place to grow into the full site.

The repository is public and `main` deploys on push, so every merge publishes
immediately. Work accordingly.

## Branching and merging

- Never commit directly to `main`. Branch, then open a pull request, even when
  working alone. The PR diff is the last point at which a mistake is catchable
  before it is both public and live.
- Branch names: `feature/…`, `fix/…`, `content/…`, `chore/…`, `docs/…`.
- Conventional commit subjects: `feat:`, `fix:`, `content:`, `chore:`, `style:`,
  `docs:`.
- Never force-push `main`.
- Keep mechanical commits (formatting, renames, moves) separate from substantive
  ones so reviewers can skip the noise.
- Commits carry the maintainer's identity only. No agent or tool co-author
  trailers.

## Setup

| Requirement | Version             | How                                         |
| ----------- | ------------------- | ------------------------------------------- |
| Node        | 22.12+, `.nvmrc`    | `nvm install && nvm use`                    |
| pnpm        | 9, `packageManager` | `corepack enable`                           |
| gitleaks    | any recent          | `brew install gitleaks`, maintainer runs it |

Nothing else is needed. Prettier, Astro and TypeScript come from
`pnpm install`; anything else a task calls for should be a one-off `npx`
invocation with its binary kept outside the repository.

```bash
nvm install && nvm use
corepack enable
pnpm install
cp .env.example .env.local          # optional, for local overrides
git config core.hooksPath .githooks # once per clone, arms the guards
pnpm verify                         # confirms the setup end to end
```

`nvm` is a shell function rather than a binary, so it only exists in shells that
have sourced `~/.nvm/nvm.sh`. Any Node 22.12+ on `PATH` works without it.

`git config core.hooksPath` is per clone and is not carried in the repository,
so a fresh clone is unprotected until it is run. The pre-commit hook blocks
local-only paths and scans staged changes for secrets; the commit-msg hook
checks the message against `.leakwords`. Without gitleaks installed the secret
scan degrades to a warning rather than failing, so the hook still runs but
catches less.

On a public repository that deploys on push, a secret caught after the push is
a secret that is already public. These local guards are the ones that matter.

### What an agent may install, and what it must hand back

Run these without asking. They are project-local and reversible:

- `pnpm install`, `pnpm install --frozen-lockfile`, `nvm use`
- `git config core.hooksPath .githooks`, and other repo-local git config
- `cp .env.example .env.local`
- `npx <tool>` for a one-off, with any downloaded binary kept in a scratch
  directory outside the repository

Stop and hand these to the maintainer. They change the machine, the supply
chain, or an account:

- System package managers and anything needing `sudo`: `brew install gitleaks`
  is the maintainer's to run. Say what is missing and what it unlocks.
- Global npm installs. Never `npm install -g`.
- New entries in `package.json`. Propose them with a reason: a dependency
  changes the lockfile and the supply chain of a public repository, and it is
  usually avoidable. `scripts/verify.mjs` is deliberately dependency-free.
- Interactive logins: `gh auth login`, `gcloud auth login`, and similar.
- Anything under GitHub repository settings: rulesets, required status checks,
  secrets, Pages configuration.
- DNS, domain, and mail configuration.

## Commands

| Command        | What it does                                                  |
| -------------- | ------------------------------------------------------------- |
| `pnpm dev`     | Dev server with hot reload at http://localhost:4321           |
| `pnpm build`   | `astro check` (strict types) then a static build into `dist/` |
| `pnpm preview` | Serves the built `dist/` locally                              |
| `pnpm check`   | Type check only                                               |
| `pnpm format`  | `prettier --write .`                                          |
| `pnpm verify`  | The full gate, see Definition of done                         |

`pnpm verify` is the gate. It runs the build, which in turn runs `astro check`,
so it catches type errors that `pnpm dev` will happily ignore, and adds the leak
and parity checks on top. Run it before committing. `pnpm verify --skip-build`
is the fast variant while iterating.

## Layout

```
public/                 static assets: CNAME, robots.txt, llms.txt,
                        mark.svg and mark-dot.svg (the icons and og.png are
                        generated but gitignored, being binaries)
src/
  pages/                routes. DE at /, EN mirrored under /en/
  layouts/BaseLayout.astro
  components/           Hero, Header, Footer, ContactCTA, Section, GlobeField,
                        PageHeader, LanguageSwitcher, BaseHead, Schema
  components/marks/     MarkGlobe, MarkWordmark, MarkLockup
  lib/globe.mjs         the mark's geometry, and mt19937.mjs under it
  i18n/{de,en,index}.ts typed string tables
  styles/global.css     Tailwind v4 @theme tokens
scripts/generate-og.mjs prebuild step, renders the SVG sources to PNG via sharp
scripts/check-globe.mjs asserts the generated mark against the artwork of record
scripts/generate-brand.mjs off-site logo files, run by hand with `pnpm brand`
scripts/generate-signature.mjs the two email footers, `pnpm signature`
scripts/tight-render.mjs  shared trim-and-fit rasteriser for both of the above
docs/                   the email footers, generated and tracked
scripts/verify.mjs      the repository gate, see Definition of done
.githooks/              pre-commit and commit-msg guards
.github/workflows/      deploy.yml, verify.yml
```

## Design system

Source of truth: the Faviens design handoff of 2026-08-08. `README.md` carries
the summary. The rules below are the ones that are easy to break by accident.

### Settled

- **Palette.** `--color-paper`, `--color-ink`, `--color-grey`, `--color-hair`,
  three golds, and the `--color-t1` to `--color-t4` ramp. Defined once in
  `src/styles/global.css`. Token names match the handoff, except the handoff's
  `--black`, which is `--color-ink` here so it does not clobber Tailwind's
  built-in black.
- **One typeface.** Archivo, self-hosted. Hierarchy comes from size, weight and
  colour only. Never add a second family, and never use a serif.
- **The accent is scarce.** One accent event per screen, and its rarity is what
  makes it read as intentional. Never combine a symbol, a letter treatment and a
  rule in one lockup.
- **The accent never sets type.** It measures 3.9:1 on paper: enough for large
  text, not enough for normal text. Use `--color-accent-d` at 5.3:1 below the
  large-text threshold, and `--color-ink` or `--color-grey` for anything that
  has to be read.
- **Reproduction floor.** Below 72px, drop every gradient and ramp and use the
  flat accent. Thicken strokes as marks shrink rather than scaling a hairline
  down.
- **Layout is Zurich modernist.** Strict grid, hairline rules, asymmetric
  balance, no ornament. Numbered sections put `01` in a 2.5rem left column with
  the heading beside it and a hairline beneath. Body copy is left-aligned and
  capped at 58ch, never full-bleed.

### Forbidden

The identity is deliberately positioned away from the AI category default. Do
not introduce nodes, circuits, mesh, hexagons or gradient blobs as decoration,
background or illustration. Do not add a second typeface. Do not set body copy
in gold. Do not stretch a mark to fill a square; letterbox instead.

The rule marks in the handoff's Family 3 are a separate matter: hairlines
converging on an open node, drawn at the same weight as the section rules. That
vocabulary is disciplined and on-brand. The ban is on decorative network
imagery, not on the handoff's own mark family.

### Colour lives in one place

Every colour in the repository is stated once, as an rgb triplet, in the `:root`
block at the top of `src/styles/global.css`. **Do not write a hex value or an rgb
triplet anywhere else**, including in a component's scoped styles, a keyframe, an
inline style or an SVG. If a colour is needed that no token covers, add the
token; if a context cannot resolve a custom property, read the token rather than
repeating its value:

- `theme-color` in `BaseHead.astro` imports the stylesheet with Vite's `?raw` and
  parses it through `scripts/tokens.mjs`.
- `public/mark.svg` and `public/mark-dot.svg` are generated by
  `scripts/generate-og.mjs` on `predev` and `prebuild`, from `src/lib/globe.mjs`
  and the palette. The icons and the link preview are rasterised from the
  templates in `scripts/assets/` in the same pass. Edit the templates and the
  generator, never a generated file. A template naming an unknown token or an
  unknown mark variant fails the build rather than shipping a placeholder.

The accent family is named `accent`, not `gold`. It was renamed on 2026-08-17,
while the palette was under review, because `text-gold-d` rendering red is worse
than any amount of renaming. Names outlive values: do not reintroduce a token
named for the colour it currently happens to be.

### The mark, and how it is drawn

The mark is a **wound-string globe**: sixty strands, each a real circle lying on
a sphere and projected orthographically. The crossings, the bunching at the
silhouette and the roundness all fall out of that 3D geometry. 2D noise does not
produce the same silhouette, and the brand package records flattening it as
tried and rejected.

It is **generated, not pasted in**. `src/lib/globe.mjs` builds the geometry and
`scripts/generate-og.mjs` writes it into `public/mark*.svg`, the favicon and the
OG image at `predev` and `prebuild`. The reason is the background field: it has
to turn the sphere, and a flattened SVG has no depth left to turn.

That freedom is only safe under one condition, and `pnpm verify` enforces it.
`src/lib/mt19937.mjs` reproduces CPython's Mersenne Twister, its `random()`,
its `gauss()` and its integer seeding, so seed 7714 draws the same sixty strands
here as it did in the brand package's Python build. `scripts/check-globe.mjs`
digests the result and compares it against `logo/faviens-circle.svg`, which is
byte for byte identical. **The committed artwork wins over the generator, never
the other way round**: if the check fails and the change was intended,
regenerate the logo files first and update the digest from them.

Two details that are load-bearing and look like noise:

- The reference uses **two different truncations of 2\*pi**, 6.283185 for the
  sweep and 6.283 for the wobble phases. They are not interchangeable, and
  collapsing them into one constant, or into a real 2*pi, moves every strand.
- The RNG is consumed in a **fixed order per strand**. Changing the order
  changes the drawing even with the same seed.

### The size ladder

The real sixty-strand mark holds down to about **28px**. Below that the strands
fall under a pixel, average together, and it rasterises as a soft pink disc:
legible as a circle, illegible as a wound one. That floor was found by
rendering, not assumed, and it is why the header wordmark is set at 30px rather
than 20px: 30px is what puts the globe beside it at 28px.

So there are two drawings and not three. `full` is used wherever the mark is a
logo, which is everywhere above 28px, including the favicon from 32px up.
`dot`, the first eight strands of the same seeded sequence, covers 13 to 20px,
where a logo never appears and a bullet does. Below about 13px nothing reads as
a sphere and the mark should be a plain dot.

A middle variant of sixteen strands existed and was removed. At 20px it is a
bold scribble, which reads as a cruder mark rather than as the logo, and the
honest choices at that size are to make the mark bigger or to accept that it is
a marker and not a logo.

Two things that were tried and do not work, so that they are not tried again:

- **Scaling the full sixty strands down to bullet size**, as vector and as a
  supersampled raster alike. Thin enough not to fill in, the strokes fall under
  a pixel and the mark is a pale disc; thick enough to see, it is a solid one.
- **Four strands at 16px.** It is a circle with two chords across it and reads
  as a "no" sign. Eight is the count with visible space between the windings.

`weight` in `VARIANTS` multiplies stroke widths in mark units, not pixels, so it
does not hold a stroke at a constant pixel width as the mark scales. The logo's
own weight at 16px is a fifth of a pixel. Each band's weight is tuned at that
band's size.

### Icons are rasters, deliberately

`BaseHead.astro` offers PNG icons and **no SVG favicon**. A browser offered one
prefers it over every PNG and then rasterises it itself, at a size and with a
filter we do not control, and sixty hairline strands is exactly the artwork that
survives that badly: the same file comes out a soft pink disc. The PNGs are
drawn here, with the strokes inked up for the small sizes, so what the tab shows
is known.

That is what the `icon` variant is: the same sixty strands as `full`, inked
heavier. The logo's own hairline is a third of a pixel at 32px, and a third of a
pixel is a third of the accent's strength. 32 and 48 use it; 180 and 512 use the
logo untouched, because at those sizes the inked-up strokes read as a heavier
drawing rather than as the same one.

There is **no 16px icon**. Nothing legible as this mark exists at 16px, and
offering a reduced eight-strand drawing there put a different mark in the tab
from the one in the header. A browser that wants 16 downsamples the 32, which is
a supersampled version of the real thing and better than either.

### The lockup

Globe left, wordmark right, on the brand package's horizontal numbers: diameter
1.34 cap heights, gap 0.35, and the circle centred on the **cap midline**, not
on the type's own box. The last one is the one that is easy to get wrong;
centred on the box the globe reads as hanging.

The wordmark is **FAV, a red bar, ENS**. The bar stands in for the I at 0.42 of
its stem width, and it is the only accent event in the mark. The `i` is still in
the text, visually hidden, with the bar carrying the advance width beside it: a
wordmark that renders as a bar and extracts as "favens" is a misspelling
everywhere the page is quoted.

Two deliberate departures from the brand package, both taken so the lockup's
parts agree with each other:

- **The bar is centred on the cap midline**, rising and dropping by 0.17 cap
  rather than the package's 0.12 and 0.22. The package imitates a real pipe
  glyph's overshoot, and on its own the bar looks right; beside the circle it
  does not, because the circle is centred on the cap midline and the two then
  disagree by a twentieth of a cap.
- **The bar's height is the circle's drawn width**, 1.34 cap times the ink
  ratio, not the nominal 1.34. The two sit side by side and the eye compares ink
  to ink; on the nominal figure the bar comes out 3% short.

The bar is drawn as an **SVG rect, not a coloured box**, and that is a
correctness fix rather than a preference. A background colour on an inline-block
is painted onto whole device pixels, so the bar's width is rounded: measured, it
came out at exactly 3, 5, 10 and 21 device pixels at the four size and density
combinations the site uses, against the 2.3, 4.5, 10.2 and 20.5 it asks for. In
the hero that is under 1%; in the header it was 8% on a retina screen and 30%
without one, and the two marks on the same page then visibly disagreed about how
thick the bar is. An SVG shape is antialiased, so the ratio now holds to half a
percent everywhere.

Archivo 800's cap height is **0.68709em** and its I stem **0.179469em**, both
measured in a browser and both stated once, in `src/lib/type.mjs`. The spec's
1760 is in font units against an em the site never sees, and assuming 0.88 from
it puts the globe a fifth too large.

Everything on the page that is a circle is centred on the cap midline: the
lockup's globe, the wordmark's bar, and every inline marker. `MarkGlobe` applies
that rule itself, so a marker never has to restate it, and the default of
resting on the baseline is what makes a round mark read as a full stop rather
than as a separator.

### The globe field, and the node field it replaced

The background is the same mark, very large and very quiet, turning behind the
page: `src/components/GlobeField.astro`, on at `quiet` everywhere except the
legal pages, which pass `background="off"`. It has two modes, `draw` (the
strands are laid down one after another as it turns, then it keeps turning) and
`rotate`; `draw` is the default and `BaseLayout` takes `backgroundMode` to
switch it.

This retires the node field, and with it the exception granted on 2026-08-17.
The ban on nodes, circuits and mesh decoration stands as written and no longer
has a carve-out: the background is now the identity itself rather than
decoration bolted onto it. The old field is in git history.

It is still decoration, so it still carries decoration's obligations:
`aria-hidden`, `pointer-events: none`, a single static frame under
`prefers-reduced-motion`, and no loop while the tab is hidden or the canvas is
off screen.

### Draft in review

As of 2026-08-17 the site runs a draft that is **not signed off**: a red accent
family in place of the handoff's gold. The palette is the ten accent and ramp
triplets in `src/styles/global.css`, and reverting it is that block and nothing
else. The gold and the tittle mark it replaced are in git history.

The globe and the bar wordmark joined it on 2026-09-04, from a brand package
delivered outside this repository, and they are not signed off either. The
earlier mark, FAVIENS with the A and the I in the accent, is in git history: the
package tried that doubling in its own wordmark and rejected it, because the V
sits between the two letters and the red reads as two unrelated highlights
rather than as a pair. Beside the globe it would also have been a third accent
event in one lockup.

Only the chosen direction is in the tree. The candidates it was chosen over, the
sheets they came from and the harness that compared them are kept outside this
repository: a site ships what it uses. Do not add a gallery of unused marks
back.

Two rules the mark depends on:

- The capitals are `text-transform` and never typed literally, or the site gets
  quoted back as "FAVIENS".
- The letters are injected as one string rather than mapped in the template. A
  line break between two letter spans is a text node, and a text node is a
  space, so a reformat would otherwise render the mark as "F A V I E N S".

One layout note that cost an iteration: the 2.5rem column only works for
numerals. A word set in it overruns into the copy beside it.

## Content rules

- **No em-dashes** anywhere in copy, comments or documentation. Use commas,
  parentheses, an interpunct, or two sentences. `pnpm verify` enforces this.
- **Swiss German orthography**: `ss`, never the sharp s.
- **Formal address** in German copy (`Sie`).
- **The name.** Faviens is a coinage, not a Latin word. Say that it "blends" or
  is "derived from" `favere` and `agens`. Never write that it "means" anything,
  and never claim it appears in classical texts.
- **Pronunciation** is deliberately split: FAY-vee-enz in English, FAH-vee-ens
  in German. Both are correct. The respelling belongs in the footer.
- A change to German copy ships with its English counterpart in the same pull
  request, and the reverse. A half-translated site is a bug.
- **No concrete engagement durations, day rates, or prices.** Describe scope
  instead, so a small engagement reads as welcome.

## Code conventions

- Quote any YAML scalar containing a colon followed by a space, or the
  frontmatter will fail to parse.
- Run `pnpm format` before committing. The repo is prettier-clean; keep it that
  way so diffs stay reviewable.
- Copy lives in `src/i18n/`, never inline in a component. `Strings` in `de.ts`
  is the interface; `en.ts` implements it, so a missing translation is a type
  error rather than a runtime surprise.

## Environment variables

`SITE_URL` and `CONTACT_EMAIL`, both optional locally (see `.env.example`).
Production sets `SITE_URL` in `deploy.yml`; `CONTACT_EMAIL` falls back to
`COMPANY.email` in `src/data/company.ts`.

The contact address is resolved once, in `src/data/company.ts`, and exported as
`CONTACT_EMAIL`. Import that wherever an address is rendered; never read
`import.meta.env.CONTACT_EMAIL` at the point of use and never inline the literal,
or the fallback drifts between pages. `COMPANY.email` is the fallback value, not
the value to render.

The origin is resolved once too, by `site` in `astro.config.mjs`. Components read
it back as `Astro.site`, through `siteOrigin()` in `src/data/site.ts`, which
throws rather than emitting a relative canonical URL. Never read `SITE_URL` from
a component: `site` already feeds the sitemap and the canonical tags, and a
second read is a second fallback. `SITE_URL` is read before the dotenv files are
loaded, so locally it has to be exported in the shell; `.env.local` is ignored
for that one variable.

Use `||` and not `??` for environment fallbacks. An unset GitHub Actions secret
expands to an empty string, which is not nullish, so `??` would let the empty
value through.

## Off-site brand assets

`pnpm brand` writes five files into `brand/`, which is gitignored, and two more
when a photograph is supplied:

| File                               | For                                     |
| ---------------------------------- | --------------------------------------- |
| `faviens-workspace-320x132`        | the Google Workspace custom logo        |
| `faviens-linkedin-400x400`         | the LinkedIn company logo, circle alone |
| `faviens-linkedin-400x400-stacked` | the same tile with the name under it    |
| `faviens-linkedin-cover-1128x191`  | the LinkedIn company page cover         |
| `faviens-linkedin-banner-1584x396` | a LinkedIn personal profile banner      |

A photograph banner is rendered too, but only when one is pointed at:

```bash
FAVIENS_PHOTO=~/pictures/alps.jpg pnpm brand
```

The source image is deliberately not in the repository: it is a binary, and the
repository keeps none. `FAVIENS_PHOTO_TREATMENT`, `_HORIZON` and `_HORIZON_AT`
tune it, and `scripts/photo-banner.mjs` explains why there are exactly two
treatments. The short version is that it is a contrast problem with a measured
answer: against a background of luminance L, ink letters clear 4.5:1 only above
123, paper letters only below 117, and the accent, whose luminance is 55, only
above 160. **White type on a dark photograph, which is the obvious reference,
has no solution at all**: no ground exists where paper letters and the accent
both hold. Either the photo is lifted towards paper and the mark stays as the
site draws it, or the red elements move to `accent-l`, the palette's own token
for reversed settings.

Three things in there are solved rather than eyeballed, and all three were bugs
first: the veil's opacity comes from the measured luminance of the region the
mark lands on, the mark's depth ramp is baked against that same measured ground
(flattening it to full opacity, so the photo cannot show through, throws away
the ramp and the sphere collapses into a scribble), and the mark's position is
searched for on smoothness, which is what puts it in the sky without anyone
saying so. `horizon` is where the skyline sits in the photo and has to be
measured per image; `horizonAt` is where it should sit in the output. Stated
that way one setting composes both sizes, where a fixed crop loses the subject
entirely from the narrower of the two.

The two flat banners are **placed, not fitted**, because LinkedIn draws on top
of them: the company logo tile sits over the bottom left of the cover, and the
profile photo over the bottom left of the personal banner, which is also cropped
tighter on a phone. So the block is anchored to one side with a stated inset and
held on the vertical centre line. Both sizes are LinkedIn's published ones,
stable for years but theirs to change.

It removes outputs it no longer produces, scoped to the `faviens-*.png` names it
writes. A target dropped from the list used to leave its last render sitting in
an ignored directory with nothing to show it was stale, which is how an avatar
carrying the previous identity survived the switch to this one.

The directory is gitignored because these are binaries and the repository keeps
none. Regenerate rather than archive. Sources are `scripts/assets/brand-*.svg`,
on the same palette tokens as everything else.

The lockups are **composed from measured parts**, not laid out in SVG, and that
is the one thing to understand before touching them. The rasteriser has no
access to Archivo and resolves a fallback face whose advance widths are not the
ones the file names, so anything positioned against the width of a text run is
positioned against a number nobody knows at authoring time. The first version of
the link preview did exactly that and came out with twice the specified gap and
a descriptor aligned to neither the wordmark nor the logo.

`scripts/lockup.mjs` composes instead, and two measurements make it
font-independent, both falling out of the wordmark's own trimmed ink:

- The bar is the tallest element in the wordmark, and its height is by
  construction the circle's width. So the circle is sized from the wordmark's
  rendered height.
- The bar is centred on the cap midline and is also the tallest element, so the
  cap midline is the trimmed image's vertical centre. The two are simply centred
  on each other.

It reports where the wordmark actually starts, which is what the link preview
aligns its descriptor to.

`pnpm signature` writes the two email footers into `docs/`, and those are
tracked, because everyone takes the same ones from the repository:

- `email-signature.html` is the whole footer: name, role, the mark, and the
  company lines. Each person pastes it into their own Gmail signature box.
- `email-footer.txt` is the org-wide append footer, set once by an admin under
  Gmail's Compliance settings. It cannot be personalised, since that setting
  takes no per-user variables, and **it takes no HTML at all**: the most it can
  show of the mark is the hosted image, through its own image control.

**Use one or the other, not both.** The signature is complete, so running it
under the append footer prints the company block twice in any email with
nothing quoted underneath, which is every first email.

The signature is type with one image. Everything a recipient acts on, the name,
the address and the link, is live text: selectable, clickable, and present in
the clients that block remote images by default, which is most corporate ones.
Only the mark is an image, because it cannot be anything else, and it carries an
alt of the name so a blocked image degrades to the word.

It sits on the site's `paper` ground rather than on the client's, so a dark
client cannot render the ink wordmark and the type beside it near-black on
near-black. The block and the logo have to carry the same ground, hence
`email-logo-paper.png`.

Neither carries a real name. `public/email-logo.png` and
`public/email-logo-paper.png` are the hosted lockup, the circle and the
wordmark, at 420x78, transparent and on the paper ground. The signature
references the paper one at half size so it stays sharp on a retina screen; the
append footer's image control takes the transparent one, which has no ground of
ours to match and accepts nothing but a URL.

The origin in both is read from `astro.config.mjs`, not written out again. That
file already applies the `SITE_URL` fallback, and a second copy is a second
fallback that drifts from the first the day the domain changes.

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`: pnpm install with a
frozen lockfile, `pnpm verify`, then upload and publish `dist/` to GitHub Pages.
`public/CNAME` keeps the custom domain attached across runs.

The `smoke` job then waits for the live domain to report this run's commit via
`build-id.txt` and checks the real pages. It stays red until the GoDaddy DNS
records and the Pages custom domain are in place. That is the intended signal.

`faviens.ch` and `faviens.de` are 301-forwarded to `https://faviens.com` at the
registrar. GitHub Pages supports only one custom domain per repository.

Do not add a `version:` input to `pnpm/action-setup@v4`. It conflicts with the
`packageManager` field in `package.json` and fails the job.

## SEO and LLM indexing

Structured data, the sitemap and the crawler files are part of the product, not
an afterthought. When adding pages:

- JSON-LD: site-wide `ProfessionalService` in `Schema.astro`.
- `@astrojs/sitemap` picks up new routes automatically, with hreflang alternates.
- `public/llms.txt` is hand-maintained and will go stale unless updated
  alongside new or renamed pages.
- `public/robots.txt` explicitly allowlists major AI crawlers.

## Legal status

The name has never been legally cleared. No Zefix, Swissreg, TMview or WIPO
search has been run for Faviens. Do not spend on launch, print or paid
placement until it has. Classes to search are 9, 35 and 42.

## Confidentiality

The working directory holds material that must never reach the repository.
`.env.local`, `tmp/` and `brand/` are gitignored and contain credentials,
client and partner source documents, and off-site brand assets.

- Nothing from those directories enters a commit. Prefer explicit paths over
  `git add -A`, and read the staged file list before committing.
- **Names of clients and partners taken from source material never appear in the
  repository**: not in page copy, not in code comments, not in commit messages,
  not in branch names. Source documents inform structure and approach only.
- **Never name the contents of a gitignored location.** Referring to an ignored
  path is fine, since `.gitignore` lists it anyway. Naming the files inside one
  is not: the filename of a local-only document reveals that the document
  exists and what it is about. Add such filenames to `.leakwords` so the hooks
  catch a slip.
- Do not use `--no-verify`, and prefer explicit paths over `git add -A` when the
  ignore rules have just changed. A `git add -A` run while a rule is missing
  will happily stage the file that rule exists to protect.
- No personal email addresses, credentials, tokens, internal URLs, or ticket
  identifiers in committed files or rendered output.
- Keep the sensitive terms to grep for in `.leakwords`, one pattern per line.
  That file is gitignored precisely because the terms themselves are the secret.

## Definition of done

Run the automated gate:

```bash
pnpm verify                  # build, formatting, leak scans, locale parity
pnpm verify --skip-build     # same minus the build, for fast iteration
```

`scripts/verify.mjs` checks the build and type-check, the generated mark against
the brand package's artwork of record, prettier cleanliness, em-dashes, generic credential patterns, terms from `.leakwords`, confidential
paths that are tracked or staged, and German/English parity. It runs in CI on
every pull request (`.github/workflows/verify.yml`) and again on the deploy
path, so a red run blocks the merge.

Then confirm by hand, since these are not mechanisable:

- New or renamed routes appear in `public/llms.txt` and are reachable through
  the navigation, not only through the sitemap.
- German and English are in sync.
- The accent appears once per screen and never sets type. The header and the
  hero lockup are the standing exception, recorded above.
- A mark is drawn at a size inside its variant's band. See the size ladder.
- `README.md` and this file still describe reality, including commands, layout
  and conventions.
- Any convention discovered while working is written into this file rather than
  left in a conversation.
- Background dev servers are stopped.

Run these checks quietly. Prefer `git diff --stat`, `grep -c`, or piping to
`tail` over commands that dump full diffs or whole files into the terminal, and
report the conclusion rather than the raw output. Show a diff only when it is
the thing being discussed, and then only the relevant hunk.
