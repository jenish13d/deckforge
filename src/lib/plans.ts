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

export const DEPTH_LABELS = { low: "Low", medium: "Medium", high: "High" } as const;
export type DepthId = keyof typeof DEPTH_LABELS;

export const PLANS = {
  free: {
    label: "Free",
    price: "$0",
    monthlyCredits: 60,
    modes: ["quick", "standard"] as ModeId[],
    depths: ["medium"] as DepthId[],
    /** Unused credits can carry over up to this many months' worth. */
    rollover: 1,
    pptx: false,
  },
  pro: {
    label: "Pro",
    price: "$12 / month",
    monthlyCredits: 1000,
    modes: ["quick", "standard", "premium"] as ModeId[],
    depths: ["low", "medium", "high"] as DepthId[],
    rollover: 1,
    pptx: true,
  },
  max: {
    label: "Max",
    price: "$29 / month",
    monthlyCredits: 4000,
    modes: ["quick", "standard", "premium"] as ModeId[],
    depths: ["low", "medium", "high"] as DepthId[],
    rollover: 2,
    pptx: true,
  },
} as const;

export type PlanId = keyof typeof PLANS;
export type PaidPlanId = Exclude<PlanId, "free">;
export const PLAN_IDS = Object.keys(PLANS) as PlanId[];

export function planOf(value: string): PlanId {
  return value === "pro" || value === "max" ? value : "free";
}

export const isPaidPlan = (value: unknown): value is PaidPlanId => value === "pro" || value === "max";

export function canUseDepth(plan: string, depth: DepthId): boolean {
  return PLANS[planOf(plan)].depths.includes(depth);
}

export const canExportPptx = (plan: string) => PLANS[planOf(plan)].pptx;

export function canUseMode(plan: string, mode: ModeId): boolean {
  return PLANS[planOf(plan)].modes.includes(mode);
}

export function cardCost(mode: ModeId, cards = 1): number {
  return MODES[mode].creditsPerCard * cards;
}

export const CREDIT_PERIOD_MS = 30 * 24 * 60 * 60 * 1000;
