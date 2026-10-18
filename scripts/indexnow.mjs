// Tells Bing (and the other IndexNow search engines: Yandex, Seznam, Naver; DuckDuckGo and Yahoo
// use Bing's index) that the site's pages changed, so new and updated pages are crawled sooner.
// Run after a deploy: `npm run indexnow` (or `npm run indexnow -- https://your-domain`).
// The key is public by design: it lives in public/<key>.txt so the engines can confirm the site is ours.
import { readdirSync } from "node:fs";

const site = (process.argv[2] ?? process.env.APP_URL ?? "https://slidezza.vercel.app").replace(/\/$/, "");
const keyFile = readdirSync(new URL("../public/", import.meta.url)).find((f) => /^[a-f0-9]{32}\.txt$/.test(f));
if (!keyFile) throw new Error("No IndexNow key file in public/");
const key = keyFile.slice(0, -4);

const sitemap = await (await fetch(`${site}/sitemap.xml`)).text();
const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).filter((u) => u.startsWith(site));
if (!urlList.length) throw new Error(`No pages in ${site}/sitemap.xml`);

const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: new URL(site).host, key, keyLocation: `${site}/${keyFile}`, urlList }),
});
console.log(`IndexNow: sent ${urlList.length} pages, answer ${res.status} ${res.statusText}`);
if (!res.ok && res.status !== 202) process.exit(1);
