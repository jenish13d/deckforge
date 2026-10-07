// Fixed-window, in-memory rate limiting. Good enough for one server; move to
// Redis/Upstash (or per-account limits) before running several instances.

interface Window {
  start: number;
  count: number;
}

export function createRateLimiter(limit: number, windowMs: number, now: () => number = Date.now) {
  const windows = new Map<string, Window>();

  return function allow(key: string): boolean {
    const t = now();
    const w = windows.get(key);
    if (!w || t - w.start >= windowMs) {
      windows.set(key, { start: t, count: 1 });
      if (windows.size > 10_000) {
        for (const [k, v] of windows) if (t - v.start >= windowMs) windows.delete(k);
      }
      return true;
    }
    if (w.count >= limit) return false;
    w.count++;
    return true;
  };
}

const HOUR = 60 * 60 * 1000;
export const limits = {
  outline: createRateLimiter(30, HOUR),
  setup: createRateLimiter(60, HOUR),
  assist: createRateLimiter(60, HOUR),
  deck: createRateLimiter(10, HOUR),
  card: createRateLimiter(200, HOUR),
  auth: createRateLimiter(20, HOUR),
  feedback: createRateLimiter(10, HOUR),
};

/** The visitor's country (ISO code) from Vercel's edge, or null when unknown (local runs). */
export function clientCountry(request: Request): string | null {
  return request.headers.get("x-vercel-ip-country") || null;
}

export function clientKey(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
}
