/// <reference types="astro/client" />

interface ImportMetaEnv {
  // SITE_URL is deliberately absent. It belongs to `astro.config.mjs`, which
  // reads it from `process.env`; components take the result as `Astro.site`.
  // Leaving it out makes a component-side read a type error rather than a
  // second fallback that can drift from the configured origin.
  readonly CONTACT_EMAIL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
