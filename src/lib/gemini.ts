import { ApiError, GoogleGenAI } from "@google/genai";
import { z } from "zod";

import type { ModelRequest } from "./ai";
import { AiBusyError, GenerationError } from "./errors";

// Google Gemini provider. Used for Quick/Standard when GEMINI_API_KEY is set and
// Claude isn't configured (Gemini's free tier lets the app run at no cost).

class GeminiError extends GenerationError {}

let client: GoogleGenAI | null = null;

/** JSON Schema for Gemini's structured output, without keys it doesn't need. */
export function toGeminiSchema(schema: z.ZodType): unknown {
  const strip = (node: unknown): unknown => {
    if (Array.isArray(node)) return node.map(strip);
    if (node && typeof node === "object") {
      const out: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(node)) {
        if (key === "$schema" || key === "additionalProperties") continue;
        out[key] = strip(value);
      }
      return out;
    }
    return node;
  };
  return strip(z.toJSONSchema(schema));
}

/** Thrown when Google's free-tier limits are hit; says when it's worth trying again. */
export class GeminiBusyError extends AiBusyError {}

const isBusy = (error: unknown): error is ApiError =>
  error instanceof ApiError && (error.status === 429 || error.status === 503);

/** Reads Google's suggested wait and whether a per-day quota was hit from a busy error. */
export function busyInfo(error: ApiError): { retryAfterSeconds: number; daily: boolean } {
  const text = error.message ?? "";
  const delay = /"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/.exec(text);
  return {
    retryAfterSeconds: delay ? Math.ceil(Number(delay[1])) : 15,
    daily: /PerDay/i.test(text),
  };
}

// Wait inside the request only for short delays; longer waits go back to the browser,
// which retries the card itself (requests are limited to 60 seconds).
const MAX_SERVER_WAIT_S = 20;

/** `maxServerWait`: how long to wait out a short rate limit before giving up (seconds). */
export async function callGemini<T>(request: ModelRequest<T>, maxServerWait = MAX_SERVER_WAIT_S): Promise<T> {
  client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const systemInstruction = request.context ? `${request.instructions}\n\n${request.context}` : request.instructions;
  let waited = 0;

  for (;;) {
    try {
      const response = await client.models.generateContent({
        model: request.model,
        contents: request.image
          ? [{ role: "user", parts: [{ inlineData: { mimeType: request.image.mime, data: request.image.data } }, { text: request.user }] }]
          : request.user,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseJsonSchema: toGeminiSchema(request.schema),
          // Quick mode skips thinking for speed; other modes use the model's default.
          ...(request.effort === null ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
        },
      });
      const text = response.text;
      if (!text) throw new GeminiError("The AI returned an empty answer. Please try again.");
      const parsed = request.schema.safeParse(JSON.parse(text));
      if (!parsed.success) throw new GeminiError("The AI's answer wasn't in the expected format. Please try again.");
      return parsed.data;
    } catch (error) {
      if (isBusy(error)) {
        const { retryAfterSeconds, daily } = busyInfo(error);
        if (!daily && waited + retryAfterSeconds <= maxServerWait) {
          await new Promise((r) => setTimeout(r, retryAfterSeconds * 1000));
          waited += retryAfterSeconds;
          continue;
        }
        throw new GeminiBusyError(retryAfterSeconds, daily);
      }
      if (error instanceof SyntaxError) throw new GeminiError("The AI's answer was cut off. Please try again.");
      throw error;
    }
  }
}

export { GeminiError };
