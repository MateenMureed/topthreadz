import { env } from '../../config/env';
import logger from '../../utils/logger';

// ── AI Provider Abstraction ──────────────────────────────────────────────
// Modular layer so additional providers (OpenAI, Anthropic, ...) can be
// registered later without touching the SEO engine itself.

export interface AiProviderRequest {
  systemPrompt: string;
  userPrompt: string;
  responseMimeType?: string;
  temperature?: number;
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
// Uses the REST endpoint with Node's global fetch. Node 18+ is required by
// the existing backend runtime; this avoids adding an SDK dependency.

const GEMINI_DEFAULT_MODEL = 'gemini-2.0-flash';
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
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= GEMINI_MAX_ATTEMPTS; attempt++) {
      try {
        return await this.callOnce(url, model, req);
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

  private async callOnce(url: string, model: string, req: AiProviderRequest): Promise<AiProviderResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: req.systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: req.userPrompt }] }],
          generationConfig: {
            temperature: req.temperature ?? 0.7,
            maxOutputTokens: req.maxOutputTokens ?? 4096,
            responseMimeType: req.responseMimeType ?? 'application/json',
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
      const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text || '').join('') || '';
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
