// Pre-launch mode (PRELAUNCH=1): the home page says "launching soon" and collects emails, and
// only admins and people with an invite code can sign up or sign in. An invite code works once,
// within a day, and the account it makes is deleted with its decks a day after sign-up.
// Turn it off on launch day by removing PRELAUNCH in Vercel and redeploying.

export const prelaunchOn = () => process.env.PRELAUNCH === "1";

/** What the admin types to delete every non-admin account. */
export const WIPE_CONFIRM = "DELETE ALL";

export const INVITE_HOURS = 24;
export const INVITE_ACCOUNT_HOURS = 24;
const HOUR = 60 * 60 * 1000;

export const inviteExpiry = (now = new Date()) => new Date(now.getTime() + INVITE_HOURS * HOUR);
export const inviteAccountExpiry = (now = new Date()) => new Date(now.getTime() + INVITE_ACCOUNT_HOURS * HOUR);

// No 0/O or 1/I/L, so a code read aloud or typed from a phone can't be mistaken.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** A new code, XXXX-XXXX, from random bytes. */
export function makeCode(bytes: Uint8Array): string {
  const chars = Array.from(bytes.slice(0, 8), (b) => ALPHABET[b % ALPHABET.length]).join("");
  return `${chars.slice(0, 4)}-${chars.slice(4, 8)}`;
}

/** A typed code in its stored form: capitals, any spaces or dashes ignored. Empty when it can't be a code. */
export function normalizeCode(value: unknown): string {
  const raw = typeof value === "string" ? value.toUpperCase().replace(/[^A-Z0-9]/g, "") : "";
  return raw.length === 8 ? `${raw.slice(0, 4)}-${raw.slice(4)}` : "";
}

/** Whether an account may be signed in now: invite accounts until they end; others only after launch, admins always. */
export function accountAllowed(user: { expiresAt: Date | null }, { admin, prelaunch, now = new Date() }: { admin: boolean; prelaunch: boolean; now?: Date }): boolean {
  if (user.expiresAt) return user.expiresAt > now;
  return admin || !prelaunch;
}

// Pages a visitor without an account can open before launch; every other page goes to the home page.
const OPEN_EXACT = new Set(["/", "/login", "/signup", "/forgot-password", "/reset-password", "/privacy", "/terms", "/admin", "/launch/leave", "/pro/leave", "/report", "/robots.txt", "/sitemap.xml", "/manifest.webmanifest", "/icon.svg", "/apple-icon", "/opengraph-image"]);
// Shared decks stay viewable (so you can show a demo); APIs and analytics check access themselves.
const OPEN_PREFIX = ["/d/", "/api/", "/ingest/", "/_next/"];

export function openBeforeLaunch(pathname: string): boolean {
  return OPEN_EXACT.has(pathname) || OPEN_PREFIX.some((p) => pathname.startsWith(p));
}
