// Quality modes and plans. Credit costs mirror what each mode costs us per card.

export const MODES = {
  quick: {
    label: "Quick",
    icon: "⚡",
    description: "Fast drafts for simple topics",
    creditsPerCard: 1,
    model: "claude-haiku-4-5",
    effort: null,
  },
  standard: {
    label: "Standard",
    icon: "✨",
    description: "Great results for most decks",
    creditsPerCard: 2,
    model: "claude-sonnet-5-5",
    effort: "medium",
  },
  premium: {
    label: "Premium",
    icon: "💎",
    description: "Best writing for pitches and client work",
    creditsPerCard: 4,
    model: "claude-opus-5-5",
    effort: "high",
  },
} as const;

export type ModeId = keyof typeof MODES;
export const MODE_IDS = Object.keys(MODES) as ModeId[];
export const DEFAULT_MODE: ModeId = "standard";

export function isModeId(value: unknown): value is ModeId {
  return typeof value === "string" && value in MODES;
}

export const PLANS = {
  free: {
    label: "Free",
    price: "$0",
    monthlyCredits: 60,
    modes: ["quick", "standard"] as ModeId[],
  },
  pro: {
    label: "Pro",
    price: "$12 / month",
    monthlyCredits: 1000,
    modes: ["quick", "standard", "premium"] as ModeId[],
  },
} as const;

export type PlanId = keyof typeof PLANS;

export function planOf(value: string): PlanId {
  return value === "pro" ? "pro" : "free";
}

export function canUseMode(plan: string, mode: ModeId): boolean {
  return PLANS[planOf(plan)].modes.includes(mode);
}

export function cardCost(mode: ModeId, cards = 1): number {
  return MODES[mode].creditsPerCard * cards;
}

export const CREDIT_PERIOD_MS = 30 * 24 * 60 * 60 * 1000;
