import { demoEnabled } from "./demo-ai";
import { PLANS, planOf, type ModeId } from "./plans";

// Which AI provider runs Quick/Standard, and whether Premium (Claude Opus) is on.
//
// - AI_PROVIDER=anthropic|gemini picks explicitly.
// - Otherwise: Claude when ANTHROPIC_API_KEY is set, else Gemini when GEMINI_API_KEY is set.
// - Premium always uses Claude, so it is only available with ANTHROPIC_API_KEY (or in demo mode).

export type Provider = "anthropic" | "gemini";

export function textProvider(): Provider {
  const explicit = process.env.AI_PROVIDER;
  if (explicit === "anthropic" || explicit === "gemini") return explicit;
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.GEMINI_API_KEY) return "gemini";
  return "anthropic";
}

export const geminiModel = (mode: "quick" | "standard") =>
  mode === "quick"
    ? process.env.GEMINI_QUICK_MODEL || "gemini-flash-lite-latest"
    : process.env.GEMINI_STANDARD_MODEL || "gemini-flash-latest";

export function premiumAvailable(): boolean {
  return demoEnabled() || Boolean(process.env.ANTHROPIC_API_KEY);
}

/** Modes a plan can use right now, given which providers are configured. */
export function availableModes(plan: string): ModeId[] {
  return PLANS[planOf(plan)].modes.filter((m) => m !== "premium" || premiumAvailable());
}
