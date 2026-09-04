#!/usr/bin/env node
// Repository gate. Runs the checks from the "Definition of done" section of
// AGENTS.md and exits non-zero on the first category that fails.
//
//   pnpm verify                 full run, including the build
//   pnpm verify --skip-build    everything except the build, for fast iteration
//
// Output is deliberately terse: a single line per check, and details only for
// the ones that fail.

import { execFileSync, execSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// These two files spell out the patterns being searched for, so a content scan
// will always match them. Everything else is fair game.
const SELF_REFERENTIAL = new Set(['AGENTS.md', 'scripts/verify.mjs']);

const ROOT = new URL('..', import.meta.url).pathname;
const SKIP_BUILD = process.argv.includes('--skip-build');

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

// Directories holding local-only material that must never be committed.
// `.env.example` is deliberately tracked and is the one exception.
const CONFIDENTIAL_PATHS = /^(tmp|brand)\/|(^|\/)\.env(?!\.example)($|\.)|(^|\/)\.leakwords$/;

// Generic credential shapes. Client-specific terms live in .leakwords, which is
// gitignored because the terms themselves are the confidential part.
const CREDENTIAL_PATTERNS = [
  [/github_pat_[A-Za-z0-9_]{20,}/, 'GitHub personal access token'],
  [/ghp_[A-Za-z0-9]{20,}/, 'GitHub token'],
  [/xox[baprs]-[A-Za-z0-9-]{10,}/, 'Slack token'],
  [/sk-[A-Za-z0-9]{20,}/, 'API secret key'],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'private key'],
  [/[A-Za-z0-9._%+-]+@gmail\.com/, 'personal email address'],
];

const BINARY_EXT = /\.(png|jpe?g|webp|avif|gif|ico|woff2?|pdf|pptx?|docx?)$/i;
// Generated or vendored, not worth scanning and noisy if we do.
const SCAN_EXCLUDE = /^(pnpm-lock\.yaml|LICENSE)$/;

/**
 * Every tracked text file. Using git's index rather than a directory walk means
 * the scan covers workflows, scripts and config too, and can never reach the
 * gitignored local-only directories.
 */
let scanCache;
function scanFiles() {
  scanCache ??= execFileSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8' })
    .split('\n')
    .filter((rel) => rel && !BINARY_EXT.test(rel) && !SCAN_EXCLUDE.test(rel))
    .map((rel) => ({ rel, path: join(ROOT, rel) }))
    .filter(({ path }) => existsSync(path));
  return scanCache;
}

/** Minimal frontmatter reader: top-level keys, and list lengths for sequences. */
function readFrontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  const body = match[1];
  const shape = {};
  const scalars = {};
  let current = null;
  for (const line of body.split(/\r?\n/)) {
    const key = line.match(/^([A-Za-z][A-Za-z0-9_]*):(.*)$/);
    if (key) {
      current = key[1];
      const inline = key[2].trim();
      shape[current] = inline === '' || inline === '|-' || inline === '|' ? 0 : null;
      if (inline && inline !== '|-' && inline !== '|') {
        scalars[current] = inline.replace(/^['"]|['"]$/g, '');
      }
      continue;
    }
    if (current !== null && /^ {2}- /.test(line) && shape[current] !== null) {
      shape[current] += 1;
    }
  }
  return { shape, scalars };
}

const checks = [];
function check(name, fn) {
  checks.push({ name, fn });
}

check('build', () => {
  if (SKIP_BUILD) return { skipped: true, note: '--skip-build' };
  try {
    execSync('pnpm build', { cwd: ROOT, stdio: 'pipe' });
    return {};
  } catch (error) {
    const out = `${error.stdout ?? ''}${error.stderr ?? ''}`.trim().split('\n');
    return { failures: out.slice(-12) };
  }
});

check('globe matches the logo', () => {
  // The mark is generated from src/lib/globe.mjs rather than pasted in, because
  // the background field has to turn the sphere and a flattened SVG has no
  // depth left to turn. That is only safe while the generator's output at rest
  // is the brand package's artwork of record, and this is what makes a drift a
  // build failure rather than a card that disagrees with the website.
  try {
    execSync('node scripts/check-globe.mjs', { cwd: ROOT, stdio: 'pipe' });
    return {};
  } catch (error) {
    const out = `${error.stdout ?? ''}${error.stderr ?? ''}`.trim().split('\n');
    return {
      failures: out,
      hint: 'regenerate the logo from the brand package first, then update the digest',
    };
  }
});

check('formatting', () => {
  try {
    execSync('npx prettier --check .', { cwd: ROOT, stdio: 'pipe' });
    return {};
  } catch (error) {
    const out = `${error.stdout ?? ''}${error.stderr ?? ''}`;
    const files = out
      .split('\n')
      .filter((l) => l.startsWith('[warn]') && !l.includes('Code style issues'))
      .map((l) => l.replace('[warn] ', '').trim());
    return { failures: files.length ? files : ['prettier --check failed'], hint: 'pnpm format' };
  }
});

check('no em-dashes', () => {
  const failures = [];
  for (const { path, rel } of scanFiles()) {
    if (SELF_REFERENTIAL.has(rel)) continue;
    readFileSync(path, 'utf8')
      .split('\n')
      .forEach((line, i) => {
        if (line.includes('—')) failures.push(`${rel}:${i + 1}`);
      });
  }
  return { failures };
});

check('no credentials', () => {
  const failures = [];
  for (const { path, rel } of scanFiles()) {
    if (SELF_REFERENTIAL.has(rel)) continue;
    readFileSync(path, 'utf8')
      .split('\n')
      .forEach((line, i) => {
        for (const [pattern, label] of CREDENTIAL_PATTERNS) {
          if (pattern.test(line)) failures.push(`${rel}:${i + 1} looks like a ${label}`);
        }
      });
  }
  return { failures };
});

check('no confidential terms', () => {
  const listPath = join(ROOT, '.leakwords');
  if (!existsSync(listPath)) return { skipped: true, note: 'no .leakwords file' };
  const terms = readFileSync(listPath, 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));
  if (!terms.length) return { skipped: true, note: '.leakwords is empty' };
  const failures = [];
  for (const { path, rel } of scanFiles()) {
    const lines = readFileSync(path, 'utf8').split('\n');
    lines.forEach((line, i) => {
      for (const term of terms) {
        if (line.toLowerCase().includes(term.toLowerCase())) {
          failures.push(`${rel}:${i + 1} contains a term from .leakwords`);
        }
      }
    });
  }
  return { failures };
});

check('no confidential paths tracked', () => {
  const failures = [];
  const tracked = execFileSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8' })
    .split('\n')
    .filter((f) => f && CONFIDENTIAL_PATHS.test(f));
  failures.push(...tracked.map((f) => `${f} is tracked by git`));

  const staged = execFileSync('git', ['diff', '--cached', '--name-only'], {
    cwd: ROOT,
    encoding: 'utf8',
  })
    .split('\n')
    .filter((f) => f && CONFIDENTIAL_PATHS.test(f));
  failures.push(...staged.map((f) => `${f} is staged`));

  return { failures };
});

check('locale parity', () => {
  const failures = [];
  const collections = join(ROOT, 'src/content');
  if (!existsSync(collections)) return { skipped: true, note: 'no content directory' };

  for (const collection of readdirSync(collections)) {
    const dir = join(collections, collection);
    if (!statSync(dir).isDirectory()) continue;

    const entries = {};
    for (const file of readdirSync(dir)) {
      const parsed = file.match(/^(.+)\.(de|en)\.md$/);
      if (!parsed) continue;
      const fm = readFrontmatter(readFileSync(join(dir, file), 'utf8'));
      if (!fm) {
        failures.push(`${collection}/${file} has no frontmatter`);
        continue;
      }
      (entries[parsed[1]] ??= {})[parsed[2]] = fm;
    }

    for (const [stem, langs] of Object.entries(entries)) {
      if (!langs.de || !langs.en) {
        failures.push(`${collection}/${stem} exists only in ${Object.keys(langs)[0]}`);
        continue;
      }
      const de = new Set(Object.keys(langs.de.shape));
      const en = new Set(Object.keys(langs.en.shape));
      for (const key of de)
        if (!en.has(key)) failures.push(`${collection}/${stem}: ${key} missing in en`);
      for (const key of en)
        if (!de.has(key)) failures.push(`${collection}/${stem}: ${key} missing in de`);
      for (const key of de) {
        if (!en.has(key)) continue;
        const a = langs.de.shape[key];
        const b = langs.en.shape[key];
        if (a !== null && b !== null && a !== b) {
          failures.push(`${collection}/${stem}: ${key} has ${a} items in de, ${b} in en`);
        }
      }
      for (const key of ['order', 'track', 'kind']) {
        const a = langs.de.scalars[key];
        const b = langs.en.scalars[key];
        if (a !== undefined && b !== undefined && a !== b) {
          failures.push(`${collection}/${stem}: ${key} is "${a}" in de but "${b}" in en`);
        }
      }
    }

    // `order` is unique within a rendered list. Collections that split into
    // several lists (partners renders `kind: partner` and `kind: project`
    // separately) number each list from one, so scope the check by `kind`.
    for (const lang of ['de', 'en']) {
      const seen = new Map();
      for (const [stem, langs] of Object.entries(entries)) {
        const scalars = langs[lang]?.scalars;
        if (!scalars || scalars.order === undefined) continue;
        const key = `${scalars.kind ?? ''}#${scalars.order}`;
        if (seen.has(key)) {
          const scope = scalars.kind ? ` (kind: ${scalars.kind})` : '';
          failures.push(
            `${collection} (${lang})${scope}: order ${scalars.order} used by ${seen.get(key)} and ${stem}`,
          );
        }
        seen.set(key, stem);
      }
    }
  }
  return { failures };
});

let failed = 0;
for (const { name, fn } of checks) {
  const result = fn();
  if (result.skipped) {
    console.log(`${DIM}-${RESET} ${name} ${DIM}(skipped: ${result.note})${RESET}`);
    continue;
  }
  const failures = result.failures ?? [];
  if (!failures.length) {
    console.log(`${GREEN}✓${RESET} ${name}`);
    continue;
  }
  failed += 1;
  console.log(`${RED}✗${RESET} ${name}`);
  for (const line of failures.slice(0, 15)) console.log(`    ${line}`);
  if (failures.length > 15) console.log(`    ${DIM}... and ${failures.length - 15} more${RESET}`);
  if (result.hint) console.log(`    ${DIM}fix: ${result.hint}${RESET}`);
}

if (failed) {
  console.log(`\n${RED}verify failed${RESET}: ${failed} check${failed > 1 ? 's' : ''}`);
  process.exit(1);
}
console.log(`\n${GREEN}verify passed${RESET}`);
