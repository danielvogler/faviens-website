// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

const SITE = process.env.SITE_URL ?? 'https://faviens.com';

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
