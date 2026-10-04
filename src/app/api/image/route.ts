import { isAllowedImageUrl } from "@/lib/cards";

// Serves Pexels photos from our own domain so the browser can draw them into
// PDF and PowerPoint exports (cross-origin images can't be read back from a canvas).
export async function GET(request: Request) {
  const src = new URL(request.url).searchParams.get("src") ?? "";
  if (!isAllowedImageUrl(src)) return new Response("Not allowed", { status: 400 });

  const upstream = await fetch(src);
  const type = upstream.headers.get("content-type") ?? "";
  if (!upstream.ok || !type.startsWith("image/")) return new Response("Image unavailable", { status: 502 });

  return new Response(upstream.body, {
    headers: {
      "content-type": type,
      "cache-control": "public, max-age=604800, immutable",
    },
  });
}
