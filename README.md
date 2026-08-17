# Faviens

> Agentic-AI consulting in Zürich, Switzerland.
> Live at **[faviens.com](https://faviens.com)**.

[![Deploy](https://img.shields.io/github/actions/workflow/status/danielvogler/faviens-website/deploy.yml?branch=main&label=deploy&logo=github)](https://github.com/danielvogler/faviens-website/actions)
[![Website](https://img.shields.io/website?url=https%3A%2F%2Ffaviens.com&up_message=live&down_message=down&label=site)](https://faviens.com)
[![Astro](https://img.shields.io/badge/Astro-6.3-FF5D01?logo=astro&logoColor=white)](https://astro.build)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)

Static, bilingual (DE / EN) placeholder site. Zero JavaScript framework, self-hosted fonts, no third-party tracking. Built with Astro and Tailwind v4, deployed via GitHub Actions to GitHub Pages, served from a custom domain. Currently a single coming-soon page; the component and i18n scaffolding is in place to grow into the full site.

Implements the Faviens design handoff of 2026-08-08. See [Design system](#design-system) for which parts are settled and which are still provisional.

## Build pipeline

```mermaid
flowchart LR
    i18n[Typed string tables<br/>DE · EN] --> astro[Astro 6<br/>static build]
    comp[Astro components<br/>Tailwind v4] --> astro
    astro --> dist[dist/]
    dist --> ci[GitHub Actions<br/>deploy-pages]
    ci --> pages[GitHub Pages]
    pages --> domain((faviens.com))
```

## Stack

| Layer           | Choice                                                              |
| --------------- | ------------------------------------------------------------------- |
| Framework       | [Astro 6](https://astro.build) (static output)                      |
| Styling         | [Tailwind CSS 4](https://tailwindcss.com) via `@tailwindcss/vite`   |
| Fonts           | Self-hosted Archivo Variable ([Fontsource](https://fontsource.org)) |
| i18n            | Astro built-in routing (DE default, EN at `/en/`)                   |
| Sitemap         | `@astrojs/sitemap` with hreflang alternates                         |
| OG image        | Build-time SVG → PNG via `sharp`                                    |
| Type checking   | TypeScript 5 (strict)                                               |
| CI              | GitHub Actions → [`deploy.yml`](.github/workflows/deploy.yml)       |
| Hosting         | GitHub Pages                                                        |
| Runtime (build) | Node 22.12+ (see [`.nvmrc`](.nvmrc))                                |
| Package manager | pnpm 9                                                              |

## Local development

```bash
pnpm install
git config core.hooksPath .githooks   # once per clone, arms the guards
pnpm dev                              # http://localhost:4321
```

Needs Node 22.12+. If you use nvm, `nvm use` picks it up from [`.nvmrc`](.nvmrc);
note that nvm is a shell function, so it only exists in shells that have sourced
`~/.nvm/nvm.sh`. Any Node 22.12+ on `PATH` works without it.

Other scripts:

```bash
pnpm check         # astro check + tsc strict
pnpm build         # produces ./dist
pnpm preview       # serves ./dist locally on :4321
pnpm format        # prettier --write .
pnpm verify        # the full gate, see below
```

## Quality gate

`pnpm verify` ([`scripts/verify.mjs`](scripts/verify.mjs), dependency-free) is
what CI runs and what blocks a merge. It checks the build and strict type-check,
prettier cleanliness, em-dashes, generic credential patterns, terms from a
local-only `.leakwords`, confidential paths that are tracked or staged, and
German/English parity. `pnpm verify --skip-build` is the fast variant.

Secret protection is layered, because on a public repository that deploys on
push, a secret caught after the push is already public:

| Layer                                          | What it does                                                                                                              |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| [`.githooks/pre-commit`](.githooks/pre-commit) | Blocks local-only paths and runs `gitleaks git --staged`. Needs `brew install gitleaks`; degrades to a warning without it |
| [`.githooks/commit-msg`](.githooks/commit-msg) | Blocks commit messages naming a term from `.leakwords`                                                                    |
| [`verify.yml`](.github/workflows/verify.yml)   | `gitleaks` over the **full history** on every PR, plus `pnpm verify`                                                      |
| [`deploy.yml`](.github/workflows/deploy.yml)   | `pnpm verify` again on the deploy path                                                                                    |

`git config core.hooksPath .githooks` is per clone and is not carried in the
repository, so a fresh clone is unprotected until it is run.

See [AGENTS.md](./AGENTS.md) for the full working conventions.

## Environment

Copy [`.env.example`](.env.example) to `.env.local` for local overrides. Production values are injected by GitHub Actions; the only required runtime variable is `SITE_URL` (set in the workflow). `CONTACT_EMAIL` falls back to `hello@faviens.com` if not set.

## Project layout

```
public/               static assets (favicon.svg, og.svg, robots, llms.txt, CNAME)
src/
  pages/              .astro routes (DE at /, EN at /en/)
  layouts/            BaseLayout
  components/         Hero, Header, Footer, ContactCTA, NodeField, ...
  components/marks/   MarkCapsAi, the wordmark
  i18n/               typed string tables (de.ts, en.ts)
  styles/global.css   Tailwind v4 @theme tokens
scripts/              build-time helpers (raster asset generation via sharp)
scripts/assets/       token-templated SVG sources for the icons and OG image
.github/workflows/    CI definition
```

## Design system

Source: **Faviens Design Handoff, 2026-08-08**.

### Settled

| Area     | Decision                                                                                                                                                                               |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Palette  | `--color-paper` `#FDFDFB`, `--color-ink` `#0E0E10`, `--color-grey` `#71716E`, `--color-hair` `#E4E3DE`, accent `#FF000D` / `#D6000B` / `#FF6B73`, tonal ramp `--color-t0`–`--color-t5` |
| Typeface | Archivo, single family. Hierarchy from size, weight and colour only. Never add a second family                                                                                         |
| Layout   | Zürich modernist: strict grid, hairline rules, numbered sections in a 2.5rem left column, copy at 58ch, one accent event per screen                                                    |

Token names match the handoff one-to-one, with two exceptions. The handoff's `--black` is `--color-ink` so it does not clobber Tailwind's built-in black, and its `gold` is `accent`: the palette is under review, and a token named for a colour becomes a lie the moment that colour changes.

**Every colour in the repository is stated once**, in the `:root` block at the top of `src/styles/global.css`, as an rgb triplet. A triplet is the only form that can also carry an alpha, which is what lets a keyframe write `rgb(var(--rgb-accent) / 0.35)` and the node field compose an alpha per frame without restating anything. `@theme` turns the triplets into the colours Tailwind generates utilities from.

Two contexts cannot resolve a CSS custom property: the `theme-color` meta tag, which takes a literal, and the standalone SVGs behind the favicon and the OG image, which have no page to inherit from. Both read the tokens instead of repeating them. `BaseHead.astro` imports the stylesheet a second time with Vite's `?raw` and parses it; `public/favicon.svg` and `public/og.svg` are **generated** from the templates in `scripts/assets/` by `scripts/generate-og.mjs`, which runs on `predev` and `prebuild` and throws if a template names a token that does not exist.

Changing the palette is therefore the ten accent and ramp lines in `global.css`, and nothing else. Verified by swapping the whole family and reverting: the mark, the status dot, the labels, the node field, the favicon and the OG image all followed.

One contrast rule is load-bearing and enforced in the components. The accent measures **3.9:1** on paper, which passes for large text and fails for normal text, so it is never used for running text or for type below the large-text threshold. `--color-accent-d` is **5.3:1** and covers small type: the eyebrows, the language switcher and the services prefix below `md` all use it.

### Draft in review, not final

As of 2026-08-17 the site runs a **draft** identity: a red accent family in place of the handoff's gold, and FAVIENS in capitals with the A and the I in the accent. It has not been through an identity review. The gold palette and the tittle mark it replaced are in git history, and reverting the palette is the ten accent and ramp triplets in `global.css`.

Only the chosen direction is in the tree. The candidates it beat, the sheets they came from and the harness that compared them are deliberately not here: the repository carries what the site uses.

The mark is **FAVIENS in capitals, ink, with the A and the I in the accent**: the two letters that spell AI inside the name, one letter apart, picked out by colour alone. No echo, no rule, no motion, which is what decided it: it needs nothing but the two colours to say what it says. See [`src/components/marks/MarkCapsAi.astro`](src/components/marks/MarkCapsAi.astro).

The capitals are `text-transform`, not typed. The page text stays "faviens", so the site is never quoted back as "FAVIENS".

### The node field

[`src/components/NodeField.astro`](src/components/NodeField.astro) draws the moving background: a mesh of drifting nodes spanning the full width of the page, with hubs that link nearly twice as far as the rest, and signals that travel an existing edge and ripple on arrival. Canvas, no dependencies, ~140 nodes at desktop and a fifth of that on a phone.

Link distance is derived from the spacing the nodes actually end up with (1.4x the mean), not set in pixels, so the mesh is as connected on a phone as on a display. Every node carries a depth that scales its size, speed and opacity. Edges and nodes are batched into six paths by opacity, so a frame is around ten draw calls rather than one per edge.

The three colours come from `--field-edge`, `--field-node` and `--field-signal` in `global.css`, so an accent change moves the field with it. There is no fallback colour in the component: a fallback would be the one place a palette value is written twice.

`BaseLayout` takes `background="off" | "quiet" | "active"` and defaults to `quiet`; the legal pages pass `off`. Under `prefers-reduced-motion` it paints one static frame and never starts the loop, and it stops entirely when the tab is hidden or it scrolls out of view.

### Still open

The name has **not been legally cleared** (Zefix, Swissreg classes 9/35/42, TMview, WIPO). The imprint and privacy pages do not exist yet. `Header` and `Footer` accept `navLinks` / `legalLinks` and render those blocks only when non-empty.

## Deployment

`main` is the deploy branch. Every push triggers [`deploy.yml`](.github/workflows/deploy.yml):

1. Install dependencies (pnpm, frozen lockfile)
2. `pnpm verify`, which runs `astro check && astro build`
3. Upload `dist/` as a Pages artifact
4. Publish via `actions/deploy-pages`
5. `smoke`: wait for the live domain to serve this run's commit, then check the real pages

The artifact contains `public/CNAME`, which keeps `faviens.com` wired to the deployment across runs.

The `smoke` job stays red until the DNS records below and the Pages custom domain are in place. That is the intended signal: it is the check that tells you the domain work is finished.

### DNS

`faviens.com` is registered at GoDaddy and points at GitHub Pages:

| Type  | Name  | Value                                                                                      |
| ----- | ----- | ------------------------------------------------------------------------------------------ |
| A     | `@`   | `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`                 |
| AAAA  | `@`   | `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153` |
| CNAME | `www` | `danielvogler.github.io`                                                                   |

`faviens.ch` and `faviens.de` are 301-forwarded to `https://faviens.com` via GoDaddy domain forwarding (no masking). GitHub Pages supports only one custom domain per repository.

## SEO and LLM indexing

- JSON-LD `ProfessionalService` schema on every page
- Sitemap with hreflang alternates (`@astrojs/sitemap`)
- [`public/robots.txt`](public/robots.txt) explicitly allowlists major AI crawlers (Anthropic, OpenAI, Perplexity, Google-Extended, etc.)
- [`public/llms.txt`](public/llms.txt) for LLM-friendly site indexing

## License

Copyright © 2026 Daniel Vogler / FAVIENS. All rights reserved. See [`LICENSE`](./LICENSE).

Source is published for transparency. No usage, redistribution, or derivative-work rights are granted without explicit written permission.
