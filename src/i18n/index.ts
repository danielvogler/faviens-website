import { de } from './de';
import { en } from './en';

export type Locale = 'de' | 'en';

const strings = { de, en } as const;

/**
 * Routes whose slug differs between locales. The naive `/en` prefix used below
 * would send /impressum to /en/impressum, which does not exist, so the language
 * switcher needs the mapping spelled out. Add a pair here whenever a page is
 * given a translated slug rather than a mirrored one.
 */
const LOCALISED_ROUTES: ReadonlyArray<readonly [string, string]> = [
  ['/impressum', '/en/imprint'],
  ['/datenschutz', '/en/privacy'],
];

export function t(locale: Locale) {
  return strings[locale];
}

export function getHomeHref(locale: Locale): string {
  return locale === 'de' ? '/' : '/en';
}

export function getLegalLinks(locale: Locale) {
  const s = strings[locale];
  const imprint = s.pages.imprint.heading;
  const privacy = s.pages.privacy.heading;
  if (locale === 'de') {
    return [
      { href: '/impressum', label: imprint },
      { href: '/datenschutz', label: privacy },
    ];
  }
  return [
    { href: '/en/imprint', label: imprint },
    { href: '/en/privacy', label: privacy },
  ];
}

export function otherLocalePath(pathname: string, currentLocale: Locale): string {
  const normalized = pathname.replace(/\/$/, '') || '/';

  for (const [dePath, enPath] of LOCALISED_ROUTES) {
    if (currentLocale === 'de' && normalized === dePath) return enPath;
    if (currentLocale === 'en' && normalized === enPath) return dePath;
  }

  if (currentLocale === 'de') {
    if (normalized === '/') return '/en';
    return `/en${normalized}`;
  }
  if (normalized === '/en') return '/';
  return normalized.replace(/^\/en/, '') || '/';
}
