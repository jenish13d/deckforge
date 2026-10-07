import { defaultCall, readImage, type ImageMime } from "@/lib/ai";
import { getCurrentUser } from "@/lib/auth";
import { AiBusyError } from "@/lib/errors";
import { busyResponse, jsonError, readJson, unauthorized } from "@/lib/http";
import { MAX_FILE_CHARS } from "@/lib/material";
import { clientCountry, clientKey, limits } from "@/lib/rate-limit";

export const maxDuration = 60;

const MIMES: readonly ImageMime[] = ["image/jpeg", "image/png", "image/webp"];
// The browser scales photos down first; this is plenty for a sharp page scan.
const MAX_BASE64 = 4_000_000;

/** Reads the text in a photo or scanned page the user attached. Files themselves aren't stored. */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!limits.extract(user.id) || !limits.extract(clientKey(request))) {
    return jsonError("Too many photos for now. Try again in an hour.", 429);
  }

  const body = await readJson(request);
  const match = typeof body?.image === "string" ? /^data:(image\/[a-z]+);base64,([A-Za-z0-9+/=]+)$/.exec(body.image) : null;
  const mime = match?.[1] as ImageMime | undefined;
  if (!match || !mime || !MIMES.includes(mime)) return jsonError("That image couldn't be read. Try a JPG or PNG.", 400);
  if (match[2].length > MAX_BASE64) return jsonError("That image is too large.", 413);

  try {
    const text = await readImage({ mime, data: match[2] }, defaultCall, { region: clientCountry(request) });
    return Response.json({ text: text.slice(0, MAX_FILE_CHARS) });
  } catch (error) {
    if (error instanceof AiBusyError) return busyResponse(error);
    console.error("Image reading failed", error);
    return jsonError("Couldn't read that image. Please try again.", 502);
  }
}
