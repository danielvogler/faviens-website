/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly SITE_URL?: string;
  readonly CONTACT_EMAIL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
