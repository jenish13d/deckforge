import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";

import type { CallModel, ModelRequest } from "./ai";
import { GenerationError } from "./errors";

// Anthropic Claude provider (Premium mode, and every mode when ANTHROPIC_API_KEY is set).

// Models that accept the server-side refusal fallback (`fallbacks: "default"`).
const FALLBACK_MODELS = new Set(["claude-opus-5-5", "claude-sonnet-5-5"]);

/** Builds the Messages API request for a structured call. Pure, so it is unit-tested. */
export function buildParams<T>(request: ModelRequest<T>) {
  const system: Anthropic.Beta.Messages.BetaTextBlockParam[] = [{ type: "text", text: request.instructions }];
  if (request.context) system.push({ type: "text", text: request.context });
  // Cache everything up to the last system block: the cards of one deck share it.
  system[system.length - 1].cache_control = { type: "ephemeral" };

  return {
    model: request.model,
    max_tokens: 16000,
    system,
    messages: [
      {
        role: "user" as const,
        content: request.image
          ? [
              { type: "image" as const, source: { type: "base64" as const, media_type: request.image.mime, data: request.image.data } },
              { type: "text" as const, text: request.user },
            ]
          : request.user,
      },
    ],
    output_config: {
      format: betaZodOutputFormat(request.schema),
      ...(request.effort ? { effort: request.effort } : {}),
    },
    // On a safety decline, let the API retry on its recommended fallback model.
    ...(FALLBACK_MODELS.has(request.model)
      ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const }
      : {}),
  };
}

let client: Anthropic | null = null;

export const callClaude: CallModel = async (request) => {
  client ??= new Anthropic();
  const response = await client.beta.messages.parse(buildParams(request));

  if (response.stop_reason === "refusal") {
    throw new GenerationError("The model declined this request.");
  }
  if (response.parsed_output == null) {
    throw new GenerationError(`No usable output (stop reason: ${response.stop_reason}).`);
  }
  return response.parsed_output;
};
