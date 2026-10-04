import { ApiError, GoogleGenAI } from "@google/genai";
import { z } from "zod";

import type { ModelRequest } from "./ai";
import { GenerationError } from "./errors";

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

const RETRY_DELAYS_MS = [4000, 10000];
const isBusy = (error: unknown) => error instanceof ApiError && (error.status === 429 || error.status === 503);

export async function callGemini<T>(request: ModelRequest<T>): Promise<T> {
  client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const systemInstruction = request.context ? `${request.instructions}\n\n${request.context}` : request.instructions;

  for (let attempt = 0; ; attempt++) {
    try {
      const response = await client.models.generateContent({
        model: request.model,
        contents: request.user,
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
      // Free-tier limits are per minute: wait and retry a couple of times.
      if (isBusy(error) && attempt < RETRY_DELAYS_MS.length) {
        await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt]));
        continue;
      }
      if (isBusy(error)) {
        throw new GeminiError("The AI is busy right now. Please try again in a minute.");
      }
      if (error instanceof SyntaxError) throw new GeminiError("The AI's answer was cut off. Please try again.");
      throw error;
    }
  }
}

export { GeminiError };
