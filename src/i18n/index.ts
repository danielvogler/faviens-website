import { de } from './de';
import { en } from './en';

export type Locale = 'de' | 'en';

const strings = { de, en } as const;

export function t(locale: Locale) {
  return strings[locale];
}

export function getHomeHref(locale: Locale): string {
  return locale === 'de' ? '/' : '/en';
}

export function otherLocalePath(pathname: string, currentLocale: Locale): string {
  const normalized = pathname.replace(/\/$/, '') || '/';
  if (currentLocale === 'de') {
    if (normalized === '/') return '/en';
    return `/en${normalized}`;
  }
  if (normalized === '/en') return '/';
  return normalized.replace(/^\/en/, '') || '/';
}
