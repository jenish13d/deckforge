import { siteUrl } from "./url";

/** Public by design: search engines fetch /<key>.txt to confirm the site is ours (see scripts/indexnow.mjs). */
export const INDEXNOW_KEY = "a182bcefc837deed288d95d45713062d";

/** Tells Bing and the other IndexNow engines that these pages changed. Never throws; does nothing on localhost. */
export async function indexNow(paths: string[]): Promise<void> {
  const base = siteUrl();
  if (!paths.length || !base.startsWith("https://")) return;
  try {
    await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host: new URL(base).host, key: INDEXNOW_KEY, keyLocation: `${base}/${INDEXNOW_KEY}.txt`, urlList: paths.map((p) => base + p) }),
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    // Search engines find the page through the sitemap anyway.
  }
}
