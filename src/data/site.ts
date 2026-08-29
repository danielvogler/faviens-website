/**
 * The canonical origin, resolved in exactly one place: `site` in
 * `astro.config.mjs`, which Astro hands to every component as `Astro.site`.
 *
 * Do not read `SITE_URL` again from a component. The config has already applied
 * the fallback, and a second read is a second fallback that can drift from it.
 */
export function siteOrigin(site: URL | undefined): URL {
  if (!site) {
    throw new Error(
      'astro.config.mjs does not set `site`, so canonical URLs and the JSON-LD @id would be relative.',
    );
  }
  return site;
}
