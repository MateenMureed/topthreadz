import { Request, Response } from 'express';
import logger from '../../utils/logger';
import { SeoService, GenerateSeoResult } from './seo.service';
import { GenerateSeoInput } from './seo.schema';
import { ProviderError } from './ai.provider';
import { describeSeoAiConfig } from './ai.provider';

export class SeoController {
  private seoService = new SeoService();

  async generate(req: Request, res: Response): Promise<void> {
    try {
      const input = req.body as GenerateSeoInput;
      const result: GenerateSeoResult = await this.seoService.generate(input, input.sections);

      res.json({
        success: true,
        data: {
          ...result.content,
          score: result.score,
          provider: result.meta.provider,
          model: result.meta.model,
        },
      });
    } catch (error: any) {
      if (error instanceof ProviderError) {
        const status = error.status && error.status >= 400 && error.status <= 599 ? error.status : 502;
        const retryable = Boolean(error.retryable);
        // Log status/class only — never the provider body or key material.
        logger.warn(`SEO generation failed (status=${status}, retryable=${retryable})`);
        res.status(retryable ? 503 : status).json({
          success: false,
          error: retryable
            ? 'The AI service is temporarily unavailable. Please try again in a moment.'
            : error.message,
          retryable,
        });
        return;
      }

      // JSON parse errors from provider output land here.
      if (error instanceof SyntaxError) {
        logger.warn('SEO generation: provider returned invalid JSON');
        res.status(502).json({
          success: false,
          error: 'The AI response could not be processed. Please try again.',
          retryable: true,
        });
        return;
      }

      logger.error('SEO generation error', error);
      res.status(500).json({
        success: false,
        error: 'SEO generation failed unexpectedly.',
        retryable: false,
      });
    }
  }

  async config(req: Request, res: Response): Promise<void> {
    res.json({ success: true, data: describeSeoAiConfig() });
  }
}
