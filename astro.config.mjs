// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// The one place the origin is defined. Components read it back as `Astro.site`
// rather than reaching for the environment a second time.
//
// This runs before Vite loads the dotenv files, so it sees the real environment
// only: locally, export SITE_URL, do not put it in `.env.local`. Reading it here
// is still right, because `site` feeds the sitemap and the canonical tags alike.
//
// `||` and not `??`: an unset GitHub Actions secret expands to an empty string,
// which is not nullish, so `??` would let the empty value through and every
// canonical URL would come out relative.
const SITE = process.env.SITE_URL || 'https://faviens.com';

export default defineConfig({
  site: SITE,
  trailingSlash: 'never',
  build: { format: 'directory' },
  i18n: {
    defaultLocale: 'de',
    locales: ['de', 'en'],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: 'de',
        locales: { de: 'de-CH', en: 'en' },
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
