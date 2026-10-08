/**
 * The site's public address, for canonical links, the sitemap and link previews.
 *
 * Order: APP_URL (set it to the production address in Vercel), then the project's production
 * domain that Vercel provides on every deployment (previews included, so a preview never
 * becomes canonical), then the production default on Vercel, then localhost for development.
 */
export function siteUrl(): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL) return `https://${process.env.NEXT_PUBLIC_SITE_DOMAIN || "slidezza.vercel.app"}`;
  return "http://localhost:3000";
}
