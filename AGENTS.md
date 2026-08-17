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
public/                 static assets: CNAME, robots.txt, llms.txt, favicon.svg, og.svg
src/
  pages/                routes. DE at /, EN mirrored under /en/
  layouts/BaseLayout.astro
  components/           Wordmark, Hero, Header, Footer, ContactCTA, Section,
                        PageHeader, LanguageSwitcher, BaseHead, Schema
  i18n/{de,en,index}.ts typed string tables
  styles/global.css     Tailwind v4 @theme tokens
scripts/generate-og.mjs prebuild step, renders the SVG sources to PNG via sharp
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
- `public/favicon.svg` and `public/og.svg` are generated from the templates in
  `scripts/assets/` by `scripts/generate-og.mjs` on `predev` and `prebuild`. Edit
  the templates, never the generated files. A template naming an unknown token
  fails the build rather than shipping an unresolved placeholder.

The accent family is named `accent`, not `gold`. It was renamed on 2026-08-17,
while the palette was under review, because `text-gold-d` rendering red is worse
than any amount of renaming. Names outlive values: do not reintroduce a token
named for the colour it currently happens to be.

### The node field, an exception granted on 2026-08-17

The maintainer asked for a moving background of gold nodes linking like an
agentic system chart. That is precisely the decoration the paragraph above rules
out, so record it as an exception rather than as the ban being lifted:
`src/components/NodeField.astro`, on at `quiet` everywhere except the legal
pages, which pass `background="off"`. Nothing else changes. No network imagery
in illustration, iconography, the OG image or the mark itself. If the identity
review rejects the field, one prop on `BaseLayout` removes it site-wide.

It is decoration, so it carries decoration's obligations: `aria-hidden`,
`pointer-events: none`, a single static frame under `prefers-reduced-motion`,
and no loop while the tab is hidden or the canvas is off screen.

### Draft in review

As of 2026-08-17 the site runs a draft that is **not signed off**: a red accent
family in place of the handoff's gold, and FAVIENS in capitals with the A and
the I in the accent (`src/components/marks/MarkCapsAi.astro`). The palette is
the ten accent and ramp triplets in `src/styles/global.css`, and reverting it is
that block and nothing else. The gold and the tittle mark it replaced are in git
history.

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
`hello@faviens.com`.

Use `||` and not `??` for environment fallbacks. An unset GitHub Actions secret
expands to an empty string, which is not nullish, so `??` would let the empty
value through.

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

`scripts/verify.mjs` checks the build and type-check, prettier cleanliness,
em-dashes, generic credential patterns, terms from `.leakwords`, confidential
paths that are tracked or staged, and German/English parity. It runs in CI on
every pull request (`.github/workflows/verify.yml`) and again on the deploy
path, so a red run blocks the merge.

Then confirm by hand, since these are not mechanisable:

- New or renamed routes appear in `public/llms.txt` and are reachable through
  the navigation, not only through the sitemap.
- German and English are in sync.
- Gold appears once per screen and never sets type.
- `README.md` and this file still describe reality, including commands, layout
  and conventions.
- Any convention discovered while working is written into this file rather than
  left in a conversation.
- Background dev servers are stopped.

Run these checks quietly. Prefer `git diff --stat`, `grep -c`, or piping to
`tail` over commands that dump full diffs or whole files into the terminal, and
report the conclusion rather than the raw output. Show a diff only when it is
the thing being discussed, and then only the relevant hunk.
