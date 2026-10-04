import "server-only";

import { createHash } from "node:crypto";
import { deriveKey } from "altcha-lib/algorithms/pbkdf2";
import { CappedMap, create, deriveHmacKeySecret, randomInt } from "altcha-lib/frameworks/nextjs";

// ALTCHA: a self-hosted, privacy-friendly captcha. The browser solves a small
// proof-of-work puzzle (about a second) after the user ticks "I'm not a robot";
// the server checks the signed answer. No third-party service or key needed.
// CAPTCHA_SECRET signs challenges (falls back to a value derived from DATABASE_URL);
// CAPTCHA=off disables it (e.g. for local testing).

export const captchaEnabled = () => process.env.CAPTCHA !== "off";

type Altcha = ReturnType<typeof create>;
let altcha: Promise<{ instance: Altcha; secret: string; keySecret: string; store: CappedMap }> | null = null;

function setup() {
  altcha ??= (async () => {
    const secret =
      process.env.CAPTCHA_SECRET ||
      createHash("sha256").update(`deckforge-captcha:${process.env.DATABASE_URL ?? ""}`).digest("hex");
    const keySecret = await deriveHmacKeySecret(secret);
    // Remembers solved challenges so each one is accepted only once.
    const store = new CappedMap({ maxSize: 10_000 });
    const instance = create({
      deriveKey,
      hmacSignatureSecret: secret,
      hmacKeySignatureSecret: keySecret,
      store,
      createChallengeParameters: () => ({
        // Work ≈ cost × counter. Tuned so a laptop finishes in about a second and a
        // phone in a few, while bots still pay for every attempt.
        algorithm: "PBKDF2/SHA-256",
        cost: 1_000,
        counter: randomInt(1_000, 3_000),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      }),
    });
    return { instance, secret, keySecret, store };
  })();
  return altcha;
}

export async function challengeResponse(request: Request): Promise<Response> {
  return (await setup()).instance.challengeHandler(request);
}

/** True when the payload is a valid, unexpired, not-yet-used solution (or captcha is off). */
export async function verifyCaptcha(payload: unknown): Promise<boolean> {
  if (!captchaEnabled()) return true;
  if (typeof payload !== "string" || !payload) return false;
  const { instance, secret, keySecret, store } = await setup();
  try {
    const result = await instance.verify(payload, deriveKey, secret, keySecret, store);
    return !result.error && Boolean(result.verification?.verified);
  } catch {
    return false;
  }
}

export const CAPTCHA_ERROR = "Please tick “I'm not a robot” and wait for the check to finish.";
