import type { ModelRequest, Role } from "./ai";
import { callClaude } from "./claude";
import { AiBusyError, GenerationError } from "./errors";
import { callGemini } from "./gemini";
import { callCompat, type CompatProvider } from "./openai-compat";
import { MODES } from "./plans";
import { geminiModel } from "./providers";
import { SITE } from "./site";
import { siteUrl } from "./url";

// The AI team: several providers, each used for what it does best, with automatic
// fallback. When one is at its free limit (or fails), the next one takes over, so a
// deck keeps being written instead of waiting.
//
// Keys (all optional; a provider is used only when its key is set):
//   ANTHROPIC_API_KEY  Claude (paid; Premium mode, and first choice when set)
//   OPENAI_API_KEY     OpenAI, e.g. GPT-6 Astra (paid; Premium mode, and first choice when set)
//   GEMINI_API_KEY     Google Gemini (free tier; GEMINI_PAID=1 once billing is on)
//   GROQ_API_KEY       Groq: very fast open models (free tier)
//   OPENROUTER_API_KEY OpenRouter: rotating free models
//   ZAI_API_KEY        Z.ai GLM Flash (free; hosted in China)

export type ProviderId = "anthropic" | "openai" | "gemini" | "groq" | "openrouter" | "zai";

// Google's terms allow only the paid Gemini API for users in the EEA, Switzerland and the UK.
// We also keep these users' text off China-hosted models, to keep GDPR simple.
const EEA_UK_CH = new Set(
  "AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE IS LI NO GB CH".split(" "),
);

export const isRestrictedRegion = (country?: string | null) => Boolean(country && EEA_UK_CH.has(country.toUpperCase()));

const KEYS: Record<ProviderId, string> = {
  anthropic: "ANTHROPIC_API_KEY",
  openai: "OPENAI_API_KEY",
  gemini: "GEMINI_API_KEY",
  groq: "GROQ_API_KEY",
  openrouter: "OPENROUTER_API_KEY",
  zai: "ZAI_API_KEY",
};

export const configured = (id: ProviderId) => Boolean(process.env[KEYS[id]]);

// Who goes first for each job. Groq is fastest, so it writes and checks cards;
// Gemini plans the deck. Claude, when paid for, leads everything.
const ORDER: Record<Role, ProviderId[]> = {
  research: ["groq", "gemini", "openrouter", "zai"],
  outline: ["gemini", "groq", "openrouter", "zai"],
  card: ["groq", "gemini", "zai", "openrouter"],
  check: ["groq", "zai", "gemini", "openrouter"],
  // Reading photos needs a model that sees images (Z.ai's free model doesn't).
  vision: ["gemini", "groq", "openrouter"],
};

/** The providers to try, in order, for a request. */
export function providerOrder(request: Pick<ModelRequest<unknown>, "role" | "mode" | "region">): ProviderId[] {
  // Paid models lead when they're set up; Premium uses only them.
  const paid = (["openai", "anthropic"] as const).filter(configured);
  if (request.mode === "premium") return [...paid];
  let order: ProviderId[] = [...paid, ...ORDER[request.role ?? "card"]];
  const preferred = process.env.AI_PROVIDER as ProviderId | undefined;
  if (preferred && preferred in KEYS) order = [preferred, ...order.filter((id) => id !== preferred)];

  const restricted = isRestrictedRegion(request.region);
  return order.filter(
    (id) =>
      configured(id) &&
      !(restricted && id === "gemini" && process.env.GEMINI_PAID !== "1") &&
      !(restricted && id === "zai") &&
      !(request.role === "vision" && id === "zai"),
  );
}

function compatProvider(id: "openai" | "groq" | "openrouter" | "zai", role: Role): CompatProvider {
  const apiKey = process.env[KEYS[id]] ?? "";
  if (id === "openai") {
    return { id, apiKey, baseUrl: "https://api.openai.com/v1", model: process.env.OPENAI_MODEL || "gpt-6-astra", openai: true };
  }
  if (id === "groq") {
    return {
      id,
      apiKey,
      baseUrl: "https://api.groq.com/openai/v1",
      // A reasoning model double-checks facts; a fast one writes; a multimodal one reads photos.
      model:
        role === "check" ? process.env.GROQ_CHECK_MODEL || "openai/gpt-oss-120b"
        : role === "vision" ? process.env.GROQ_VISION_MODEL || "meta-llama/llama-4-scout-17b-16e-instruct"
        : process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    };
  }
  if (id === "openrouter") {
    return {
      id,
      apiKey,
      baseUrl: "https://openrouter.ai/api/v1",
      model: process.env.OPENROUTER_MODEL || "openrouter/free",
      headers: { "HTTP-Referer": siteUrl(), "X-Title": SITE.name },
    };
  }
  return { id, apiKey, baseUrl: "https://api.z.ai/api/paas/v4", model: process.env.ZAI_MODEL || "glm-4.7-flash" };
}

function runOn<T>(id: ProviderId, request: ModelRequest<T>, isLast: boolean): Promise<T> {
  const mode = request.mode ?? "standard";
  const role = request.role ?? "card";
  if (id === "anthropic") {
    const own = request.provider === "anthropic";
    const quickJob = role === "check" || role === "research" || role === "vision";
    return callClaude({
      ...request,
      provider: "anthropic",
      model: own ? request.model : MODES[quickJob ? "quick" : mode].model,
      effort: own ? request.effort : MODES[quickJob ? "quick" : mode].effort,
    });
  }
  if (id === "gemini") {
    const own = request.provider === "gemini";
    return callGemini(
      {
        ...request,
        provider: "gemini",
        model: own ? request.model : geminiModel(mode === "quick" ? "quick" : "standard"),
        effort: own ? request.effort : mode === "quick" ? null : "medium",
      },
      // Only wait out Gemini's short limits when nobody else can take the job.
      isLast ? undefined : 0,
    );
  }
  return callCompat(compatProvider(id, role), request);
}

// Providers at their limit are skipped until this time (per server instance).
const coolingUntil = new Map<ProviderId, number>();

export async function routeCall<T>(request: ModelRequest<T>): Promise<T> {
  const order = providerOrder(request);
  if (order.length === 0) {
    throw new GenerationError(
      request.mode === "premium"
        ? "Premium mode is coming soon. Pick Quick or Standard."
        : "The AI isn't available right now. Please try again a little later.",
    );
  }
  const now = Date.now();
  const ready = order.filter((id) => (coolingUntil.get(id) ?? 0) <= now);
  const attempts = ready.length ? ready : order;

  let busy: AiBusyError | null = null;
  let failure: unknown = null;
  for (const [i, id] of attempts.entries()) {
    try {
      return await runOn(id, request, i === attempts.length - 1);
    } catch (error) {
      if (error instanceof AiBusyError) {
        const wait = error.daily ? 6 * 3600 : Math.max(15, error.retryAfterSeconds);
        coolingUntil.set(id, now + wait * 1000);
        busy = error;
      } else {
        failure = error;
      }
      console.error(`AI provider ${id} failed (${request.role ?? "card"})`, error instanceof Error ? error.message : error);
    }
  }
  // A busy answer lets the browser wait and retry; otherwise show a safe message.
  if (busy) throw busy;
  if (failure instanceof GenerationError) throw failure;
  throw new GenerationError("The AI couldn't write this. Please try again.");
}
