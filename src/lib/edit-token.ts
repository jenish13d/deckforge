import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

// Decks have no accounts yet: whoever holds a deck's edit token can change it.
// The browser that created the deck keeps the token; the server stores only its hash.

export function newEditToken(): { token: string; hash: string } {
  const token = randomBytes(24).toString("base64url");
  return { token, hash: hashToken(token) };
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function tokenMatches(token: string | null, hash: string): boolean {
  if (!token) return false;
  const a = Buffer.from(hashToken(token), "hex");
  const b = Buffer.from(hash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

export { EDIT_TOKEN_HEADER } from "./edit-token-header";
