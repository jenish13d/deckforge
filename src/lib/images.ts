import "server-only";

import type { CardImage } from "./cards";
import { SITE } from "@/lib/site";
import { stems, wikiHeaders, type Source } from "./research";

// Photos for slides.
// - Default: Openverse (https://openverse.org), no key needed. We only use Flickr and
//   Wikimedia photos under licenses that allow commercial use without share-alike
//   (CC BY, CC0, public domain). Anonymous limits: about 20 searches/minute, 200/day.
// - With PEXELS_API_KEY set: Pexels instead.
// - PHOTOS=off turns photos off.
// Every slide credits the photo (creator, license or source) with a link to its page.

export const imagesEnabled = () => process.env.PHOTOS !== "off";

export interface PhotoResult extends CardImage {
  thumb: string;
}

const USER_AGENT = `${SITE.name}/1.0 (presentation maker)`;

interface PexelsPhoto {
  url: string;
  photographer: string;
  alt: string | null;
  src: { large2x: string; medium: string };
}

async function searchPexels(query: string, perPage: number, key: string): Promise<PhotoResult[]> {
  const url = `https://api.pexels.com/v1/search?${new URLSearchParams({ query, per_page: String(perPage), orientation: "landscape" })}`;
  const response = await fetch(url, { headers: { Authorization: key }, next: { revalidate: 86400 }, signal: AbortSignal.timeout(10_000) });
  if (!response.ok) {
    console.error(`Pexels search failed (${response.status}) for "${query}"`);
    return [];
  }
  const data = (await response.json()) as { photos?: PexelsPhoto[] };
  return (data.photos ?? []).map((p) => ({
    url: p.src.large2x,
    thumb: p.src.medium,
    alt: p.alt || query,
    credit: `${p.photographer} / Pexels`,
    creditUrl: p.url,
  }));
}

interface OpenverseImage {
  url: string;
  thumbnail: string;
  title: string | null;
  creator: string | null;
  license: string;
  license_version: string | null;
  foreign_landing_url: string;
  width: number | null;
  height: number | null;
}

/** Credits and titles from photo sites can arrive HTML-escaped ("Sam &amp; Emer"). */
export function decodeEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

/**
 * The same photo at another size is still the same photo: Wikimedia thumbnails
 * ("…/thumb/a/ab/File.jpg/1280px-File.jpg") and originals share the file name.
 */
export function photoKey(url: string): string {
  const path = url.split("?")[0];
  const m = /\/commons\/(?:thumb\/)?[0-9a-f]\/[0-9a-f]{2}\/([^/]+)/.exec(path);
  return m ? decodeURIComponent(m[1]).toLowerCase() : path.toLowerCase();
}

const LICENSE_LABELS: Record<string, string> = { by: "CC BY", cc0: "CC0", pdm: "Public domain" };

/** Wikimedia originals can be huge; ask for a 1280px-wide version instead. */
export function wikimediaSized(url: string, width: number | null): string {
  const m = /^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/([0-9a-f])\/([0-9a-f]{2})\/([^/]+)$/.exec(url);
  if (!m || !width || width <= 1280) return url;
  return `https://upload.wikimedia.org/wikipedia/commons/thumb/${m[1]}/${m[2]}/${m[3]}/1280px-${m[3]}`;
}

async function searchOpenverse(query: string, perPage: number): Promise<PhotoResult[]> {
  const url = `https://api.openverse.org/v1/images/?${new URLSearchParams({
    q: query,
    license: "by,cc0,pdm",
    source: "flickr,wikimedia",
    aspect_ratio: "wide",
    mature: "false",
    page_size: String(perPage),
  })}`;
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT }, next: { revalidate: 86400 }, signal: AbortSignal.timeout(10_000) });
  if (!response.ok) {
    console.error(`Openverse search failed (${response.status}) for "${query}"`);
    return [];
  }
  const data = (await response.json()) as { results?: OpenverseImage[] };
  return (data.results ?? []).map((r) => {
    const license = [LICENSE_LABELS[r.license] ?? r.license.toUpperCase(), r.license === "by" ? r.license_version : null]
      .filter(Boolean)
      .join(" ");
    return {
      url: wikimediaSized(r.url, r.width),
      thumb: r.thumbnail,
      alt: decodeEntities(r.title || query),
      credit: r.creator ? `${decodeEntities(r.creator)} (${license})` : license,
      creditUrl: r.foreign_landing_url,
      ...(r.width && r.height ? { width: r.width, height: r.height } : {}),
    };
  });
}

export async function searchPhotos(query: string, perPage = 6): Promise<PhotoResult[]> {
  const q = query.trim().slice(0, 100);
  if (!imagesEnabled() || !q) return [];
  const key = process.env.PEXELS_API_KEY;
  return key ? searchPexels(q, perPage, key) : searchOpenverse(q, perPage);
}

// Wikipedia photos: for a deck about a real subject, the subject's own article has
// captioned photos of exactly that person or place ("Ronaldo playing for Juventus in
// 2019"), so the slide never shows someone else. Only free files hosted on Wikimedia
// Commons are used, credited with their author and license.

interface WikiMedia {
  file: string;
  caption: string;
  lead: boolean;
}

async function articleMedia(title: string): Promise<WikiMedia[]> {
  const url = `https://en.wikipedia.org/api/rest_v1/page/media-list/${encodeURIComponent(title.replace(/ /g, "_"))}`;
  const response = await fetch(url, { headers: wikiHeaders(), next: { revalidate: 86400 }, signal: AbortSignal.timeout(10_000) });
  if (!response.ok) return [];
  const data = (await response.json()) as { items?: { title: string; type: string; leadImage?: boolean; caption?: { text?: string } }[] };
  return (data.items ?? [])
    .filter((i) => i.type === "image" && /\.(jpe?g|webp)$/i.test(i.title))
    .map((i) => ({ file: i.title, caption: i.caption?.text ?? "", lead: Boolean(i.leadImage) }));
}

interface FileInfo {
  url: string;
  width: number;
  height: number;
  credit: string;
  creditUrl: string;
}

const stripTags = (html: string) => decodeEntities(html.replace(/<[^>]*>/g, "")).replace(/\s+/g, " ").trim();

/** URL, size and credit of free Commons files (non-free and local files are left out). */
async function fileInfo(files: string[]): Promise<Map<string, FileInfo>> {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    titles: files.join("|"),
    prop: "imageinfo",
    iiprop: "url|size|extmetadata",
    // A sharp but light version (fits 1280×1280): originals can be several megabytes.
    iiurlwidth: "1280",
    iiurlheight: "1280",
    iiextmetadatafilter: "LicenseShortName|Artist|NonFree",
  });
  const response = await fetch(`https://en.wikipedia.org/w/api.php?${params}`, {
    headers: wikiHeaders(),
    next: { revalidate: 86400 },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) return new Map();
  type Meta = { value?: string };
  const data = (await response.json()) as {
    query?: {
      normalized?: { from: string; to: string }[];
      pages?: {
        title: string;
        imageinfo?: {
          url: string;
          thumburl?: string;
          thumbwidth?: number;
          thumbheight?: number;
          width: number;
          height: number;
          descriptionurl: string;
          extmetadata?: { LicenseShortName?: Meta; Artist?: Meta; NonFree?: Meta };
        }[];
      }[];
    };
  };
  const original = new Map((data.query?.normalized ?? []).map((n) => [n.to, n.from]));
  const out = new Map<string, FileInfo>();
  for (const page of data.query?.pages ?? []) {
    const info = page.imageinfo?.[0];
    const meta = info?.extmetadata;
    if (!info || !info.url.startsWith("https://upload.wikimedia.org/wikipedia/commons/")) continue;
    if (meta?.NonFree?.value && meta.NonFree.value !== "false") continue;
    const license = stripTags(meta?.LicenseShortName?.value ?? "");
    if (!/^(cc[ -]by|cc0|public domain|pd)/i.test(license)) continue;
    const artist = stripTags(meta?.Artist?.value ?? "").slice(0, 80);
    // Tracking parameters aren't needed and would make the same photo look like a different one.
    const bare = (url: string) => url.split("?")[0];
    const thumb = info.thumburl && info.thumbwidth && info.thumbheight ? bare(info.thumburl) : null;
    out.set(original.get(page.title) ?? page.title, {
      url: thumb ?? bare(info.url),
      width: thumb ? info.thumbwidth! : info.width,
      height: thumb ? info.thumbheight! : info.height,
      credit: artist ? `${artist} (${license})` : license,
      creditUrl: info.descriptionurl,
    });
  }
  return out;
}

/** The article photo whose caption best matches the card, for a deck with sources. */
export async function findWikiPhoto(
  query: string,
  articles: string[],
  exclude: ReadonlySet<string>,
  cover: boolean,
): Promise<CardImage | null> {
  const media = (await Promise.all(articles.slice(0, 3).map((a) => articleMedia(a).catch(() => [])))).flat();
  if (media.length === 0) return null;
  const want = stems(query);
  // Words in nearly every caption (the subject's name) don't help tell photos apart.
  const everywhere = new Set([...want].filter((w) => media.filter((m) => stems(`${m.caption} ${m.file}`).has(w)).length > media.length / 2));
  const used = new Set([...exclude].map(photoKey));
  const ranked = media
    .map((m, i) => {
      const have = stems(`${m.caption} ${m.file.replace(/[_.]/g, " ")}`);
      let score = 0;
      for (const w of want) if (have.has(w)) score += everywhere.has(w) ? 0.2 : 1;
      if (m.lead) score += cover ? 5 : -0.5;
      // A caption that never names the subject is probably about someone or something else.
      if (everywhere.size && m.caption && ![...everywhere].some((w) => have.has(w))) score -= 3;
      return { ...m, score, i };
    })
    .filter((m) => m.score > -2 && !used.has(photoKey(m.file.replace(/^File:/, ""))))
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .slice(0, 30);
  const infos = await fileInfo(ranked.map((m) => m.file));
  for (const m of ranked) {
    const info = infos.get(m.file);
    if (!info || used.has(photoKey(info.url)) || info.width < 700 || info.height < 450) continue;
    return { url: info.url, alt: stripTags(m.caption) || query, credit: info.credit, creditUrl: info.creditUrl, width: info.width, height: info.height };
  }
  return null;
}

/**
 * The best photo for a card, skipping any in `exclude` (photos already used in the deck).
 * Decks with sources use their Wikipedia articles' photos first.
 */
export async function findPhoto(
  query: string,
  exclude: ReadonlySet<string> = new Set(),
  options: { sources?: Source[]; cover?: boolean } = {},
): Promise<CardImage | null> {
  if (!imagesEnabled() || !query.trim()) return null;
  if (options.sources?.length) {
    const photo = await findWikiPhoto(query, options.sources.map((s) => s.title), exclude, Boolean(options.cover)).catch((error: unknown) => {
      console.error("Wikipedia photo lookup failed", error);
      return null;
    });
    if (photo) return photo;
  }
  // A deck about a real subject (its main Wikipedia article) only takes outside photos whose
  // title names that subject; otherwise a search for "Ronaldo Chelsea" can return a Chelsea player.
  const subject = options.sources?.find((s) => s.kind === "wikipedia")?.title;
  // The subject's last name is enough ("Ronaldo"); full names are often shortened in photo titles.
  const surname = subject ? [...stems(subject.replace(/\(.*?\)/g, ""))].pop() : undefined;
  const used = new Set([...exclude].map(photoKey));
  const fits = (p: PhotoResult) => !used.has(photoKey(p.url)) && (!surname || stems(`${p.alt} ${p.creditUrl}`).has(surname));
  try {
    // Specific queries ("Lionel Messi Argentina 2006") can find nothing; drop words from the end until something matches.
    const words = query.trim().split(/\s+/);
    let first: PhotoResult | undefined;
    // At most three searches, and never fewer than two words.
    for (let n = words.length; n >= Math.max(Math.min(2, words.length), words.length - 2) && !first; n--) {
      first = (await searchPhotos(words.slice(0, n).join(" "), exclude.size || surname ? 10 : 1)).find(fits);
    }
    if (!first) return null;
    const { url, alt, credit, creditUrl, width, height } = first;
    return { url, alt, credit, creditUrl, ...(width && height ? { width, height } : {}) };
  } catch (error) {
    console.error("Photo lookup failed", error);
    return null;
  }
}

export const IMAGE_FETCH_HEADERS = { "User-Agent": USER_AGENT };
