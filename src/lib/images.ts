import "server-only";

import type { CardImage } from "./cards";

// Stock photos from Pexels (free; needs PEXELS_API_KEY from https://www.pexels.com/api/).
// Pexels asks apps to credit photographers, which every card does under its photo.

export const imagesEnabled = () => Boolean(process.env.PEXELS_API_KEY);

interface PexelsPhoto {
  url: string;
  photographer: string;
  alt: string | null;
  src: { large: string; large2x: string; medium: string };
}

export interface PhotoResult extends CardImage {
  thumb: string;
}

export async function searchPhotos(query: string, perPage = 6): Promise<PhotoResult[]> {
  const key = process.env.PEXELS_API_KEY;
  const q = query.trim().slice(0, 100);
  if (!key || !q) return [];

  const url = `https://api.pexels.com/v1/search?${new URLSearchParams({
    query: q,
    per_page: String(perPage),
    orientation: "landscape",
  })}`;
  const response = await fetch(url, { headers: { Authorization: key }, next: { revalidate: 86400 } });
  if (!response.ok) {
    console.error(`Pexels search failed (${response.status}) for "${q}"`);
    return [];
  }
  const data = (await response.json()) as { photos?: PexelsPhoto[] };
  return (data.photos ?? []).map((p) => ({
    url: p.src.large2x,
    thumb: p.src.medium,
    alt: p.alt || q,
    credit: p.photographer,
    creditUrl: p.url,
  }));
}

/** The best photo for a card, or null when there's none (or photos are off). */
export async function findPhoto(query: string): Promise<CardImage | null> {
  if (!imagesEnabled() || !query.trim()) return null;
  try {
    const [first] = await searchPhotos(query, 1);
    if (!first) return null;
    return { url: first.url, alt: first.alt, credit: first.credit, creditUrl: first.creditUrl };
  } catch (error) {
    console.error("Photo lookup failed", error);
    return null;
  }
}
