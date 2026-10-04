import "server-only";

import type { CardImage } from "./cards";

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

const USER_AGENT = "Deckforge/1.0 (presentation maker)";

interface PexelsPhoto {
  url: string;
  photographer: string;
  alt: string | null;
  src: { large2x: string; medium: string };
}

async function searchPexels(query: string, perPage: number, key: string): Promise<PhotoResult[]> {
  const url = `https://api.pexels.com/v1/search?${new URLSearchParams({ query, per_page: String(perPage), orientation: "landscape" })}`;
  const response = await fetch(url, { headers: { Authorization: key }, next: { revalidate: 86400 } });
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
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT }, next: { revalidate: 86400 } });
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
      alt: r.title || query,
      credit: r.creator ? `${r.creator} (${license})` : license,
      creditUrl: r.foreign_landing_url,
    };
  });
}

export async function searchPhotos(query: string, perPage = 6): Promise<PhotoResult[]> {
  const q = query.trim().slice(0, 100);
  if (!imagesEnabled() || !q) return [];
  const key = process.env.PEXELS_API_KEY;
  return key ? searchPexels(q, perPage, key) : searchOpenverse(q, perPage);
}

/** The best photo for a card, or null when there's none (or photos are off). */
export async function findPhoto(query: string): Promise<CardImage | null> {
  if (!imagesEnabled() || !query.trim()) return null;
  try {
    const [first] = await searchPhotos(query, 1);
    return first ? { url: first.url, alt: first.alt, credit: first.credit, creditUrl: first.creditUrl } : null;
  } catch (error) {
    console.error("Photo lookup failed", error);
    return null;
  }
}

export const IMAGE_FETCH_HEADERS = { "User-Agent": USER_AGENT };
