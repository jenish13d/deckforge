import { z } from "zod";

import type { ModelRequest } from "./ai";
import { AiBusyError } from "./errors";
import { toGeminiSchema } from "./gemini";

// One client for the providers that speak OpenAI's chat-completions format:
// OpenAI, Groq, OpenRouter and Z.ai (GLM). Answers are JSON checked against the request's schema.

export interface CompatProvider {
  id: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  headers?: Record<string, string>;
  /** OpenAI's newer models take max_completion_tokens and only their default temperature. */
  openai?: boolean;
}

/** A provider is at its rate limit; the router moves on to the next one. */
export class ProviderBusyError extends AiBusyError {}

/** A provider failed in a way that isn't meant for users' eyes (logged, then the next provider runs). */
export class ProviderError extends Error {}

const TIMEOUT_MS = 40_000;

/** The JSON object in a model's answer, ignoring ``` fences or words around it. */
export function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) throw new ProviderError("No JSON object in the answer.");
  return JSON.parse(text.slice(start, end + 1));
}

type JsonSchema = { type?: string | string[]; properties?: Record<string, JsonSchema>; items?: JsonSchema; required?: string[] };

/**
 * Smaller models sometimes leave out fields they had nothing for. Fill those with
 * empty values ("" / [] / false) so a good answer isn't thrown away over a missing key.
 */
export function fillMissing(value: unknown, schema: JsonSchema): unknown {
  const type = Array.isArray(schema.type) ? schema.type[0] : schema.type;
  if (type === "object" && schema.properties) {
    const source = value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
    const out: Record<string, unknown> = { ...source };
    for (const [key, child] of Object.entries(schema.properties)) out[key] = fillMissing(source[key], child);
    return out;
  }
  if (type === "array") return Array.isArray(value) ? value.map((v) => (schema.items ? fillMissing(v, schema.items) : v)) : [];
  if (value !== undefined && value !== null) return value;
  if (type === "string") return "";
  if (type === "boolean") return false;
  if (type === "number" || type === "integer") return 0;
  return value;
}

export async function callCompat<T>(provider: CompatProvider, request: ModelRequest<T>): Promise<T> {
  const jsonSchema = toGeminiSchema(request.schema) as JsonSchema;
  const system = [
    request.instructions,
    request.context ?? "",
    `Reply with only one JSON object that matches this JSON Schema, with no other text:\n${JSON.stringify(jsonSchema)}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const response = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${provider.apiKey}`, ...provider.headers },
    body: JSON.stringify({
      model: provider.model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: request.user },
      ],
      ...(provider.openai
        ? { max_completion_tokens: 16000 }
        : { temperature: request.role === "check" ? 0 : 0.5, max_tokens: 6000 }),
      response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  }).catch((error: unknown) => {
    throw new ProviderError(`${provider.id} didn't answer in time.`, { cause: error });
  });

  if (response.status === 429 || response.status === 503 || response.status === 529) {
    const retryAfter = Number(response.headers.get("retry-after"));
    throw new ProviderBusyError(Number.isFinite(retryAfter) && retryAfter > 0 ? Math.ceil(retryAfter) : 30, false);
  }
  if (!response.ok) {
    const detail = (await response.text().catch(() => "")).slice(0, 300);
    throw new ProviderError(`${provider.id} error ${response.status}: ${detail}`);
  }

  const data = (await response.json()) as { choices?: { message?: { content?: string | null } }[] };
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new ProviderError(`${provider.id} returned an empty answer.`);
  const raw = extractJson(text);
  const parsed = request.schema.safeParse(raw);
  if (parsed.success) return parsed.data;
  const filled = request.schema.safeParse(fillMissing(raw, jsonSchema));
  if (filled.success) return filled.data;
  throw new ProviderError(`${provider.id}'s answer didn't match the format: ${z.prettifyError(filled.error).slice(0, 200)}`);
}
