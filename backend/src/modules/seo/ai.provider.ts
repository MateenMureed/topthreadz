import { env } from '../../config/env';
import logger from '../../utils/logger';

// ── AI Provider Abstraction ──────────────────────────────────────────────
// Modular layer so additional providers (OpenAI, Anthropic, ...) can be
// registered later without touching the SEO engine itself.

export interface AiProviderRequest {
  systemPrompt: string;
  userPrompt: string;
  responseMimeType?: string;
  responseSchema?: Record<string, unknown>;
  temperature?: number; // ignored by Gemini 3 Interactions API (deprecated there); kept for other providers
  maxOutputTokens?: number;
}

export interface AiProviderResponse {
  text: string;
  model: string;
}

export interface AiProvider {
  name: string;
  isConfigured(): boolean;
  generate(req: AiProviderRequest): Promise<AiProviderResponse>;
}

class ProviderError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly retryable?: boolean
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

export { ProviderError };

// ── Gemini provider (Google AI Studio free tier) ─────────────────────────
// Uses the Interactions API (POST /v1beta/interactions) — Google's
// recommended interface as of 2026 — via Node's global fetch. Node 18+ is
// required by the existing backend runtime; this avoids adding an SDK
// dependency. gemini-2.0-flash was shut down June 1, 2026; the current
// default is gemini-3.6-flash (GA, free tier supported).

const GEMINI_DEFAULT_MODEL = 'gemini-3.6-flash';
const GEMINI_INTERACTIONS_URL = 'https://generativelanguage.googleapis.com/v1beta/interactions';
const GEMINI_TIMEOUT_MS = 30_000;
const GEMINI_MAX_ATTEMPTS = 2;
const GEMINI_RETRY_DELAY_MS = 2_000;

class GeminiProvider implements AiProvider {
  name = 'gemini';

  isConfigured(): boolean {
    return Boolean(env.GEMINI_API_KEY);
  }

  async generate(req: AiProviderRequest): Promise<AiProviderResponse> {
    const model = env.GEMINI_MODEL || GEMINI_DEFAULT_MODEL;

    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= GEMINI_MAX_ATTEMPTS; attempt++) {
      try {
        return await this.callOnce(model, req);
      } catch (error: any) {
        lastError = error;
        const status = error instanceof ProviderError ? error.status : undefined;
        const isRateLimit = status === 429 || status === 503;
        // Never log the API key or full remote body: log status only.
        logger.warn(
          `SEO AI provider attempt ${attempt}/${GEMINI_MAX_ATTEMPTS} failed (status=${status ?? 'n/a'})`
        );
        if (attempt < GEMINI_MAX_ATTEMPTS && (isRateLimit || status === 500)) {
          await this.delay(GEMINI_RETRY_DELAY_MS * attempt);
          continue;
        }
        throw error;
      }
    }
    throw lastError ?? new Error('AI provider failed');
  }

  private async callOnce(model: string, req: AiProviderRequest): Promise<AiProviderResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

    try {
      const response = await fetch(GEMINI_INTERACTIONS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          model,
          // Plain string input is the simple form; system instruction is a
          // top-level field in the Interactions API.
          input: req.userPrompt,
          system_instruction: req.systemPrompt,
          // Schema-enforced structured output: the model must return JSON
          // complying with response_format, which removes prompt-shape drift.
          ...(req.responseSchema
            ? {
                response_format: {
                  type: 'text',
                  mime_type: req.responseMimeType || 'application/json',
                  schema: req.responseSchema,
                },
              }
            : req.responseMimeType
              ? { response_mime_type: req.responseMimeType }
              : {}),
          // Do not persist prompt/response content server-side (data
          // minimization for admin product data).
          store: false,
          generation_config: {
            ...(req.maxOutputTokens ? { max_output_tokens: req.maxOutputTokens } : {}),
          },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        // Never include the raw body: it may echo request content.
        let statusText = '';
        try {
          const parsed = (await response.json()) as any;
          statusText = parsed?.error?.message ? String(parsed.error.message).slice(0, 200) : '';
        } catch {
          /* ignore body parse failures */
        }
        const retryable = response.status === 429 || response.status >= 500;
        throw new ProviderError(
          statusText || `Gemini API responded with status ${response.status}`,
          response.status,
          retryable
        );
      }

      const data = (await response.json()) as any;
      if (data?.status && data.status !== 'completed') {
        throw new ProviderError(
          `Gemini interaction ended with status "${data.status}"`,
          502,
          true
        );
      }

      // output_text is the canonical aggregated text of the model's response.
      let text: string = typeof data?.output_text === 'string' ? data.output_text : '';
      if (!text && Array.isArray(data?.steps)) {
        // Fallback: concatenate text parts from model output steps.
        text = (data.steps as any[])
          .filter((s) => s?.type === 'model_output')
          .flatMap((s) => Array.isArray(s?.content) ? s.content : [])
          .filter((c: any) => c?.type === 'text' && typeof c?.text === 'string')
          .map((c: any) => c.text)
          .join('');
      }
      if (!text) {
        throw new ProviderError('Gemini returned an empty response', 502, true);
      }
      return { text, model };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new ProviderError('AI request timed out', 504, true);
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  private delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ── Registry ─────────────────────────────────────────────────────────────

const providers: Record<string, AiProvider> = {
  gemini: new GeminiProvider(),
};

export function getSeoAiProvider(): AiProvider {
  const name = env.SEO_AI_PROVIDER || 'gemini';
  const provider = providers[name];
  if (!provider) {
    throw new ProviderError(`Unknown SEO AI provider: ${name}`, undefined, false);
  }
  return provider;
}

export function describeSeoAiConfig(): { provider: string; model: string; configured: boolean } {
  const provider = getSeoAiProvider();
  return {
    provider: provider.name,
    model: env.GEMINI_MODEL || GEMINI_DEFAULT_MODEL,
    configured: provider.isConfigured(),
  };
}
