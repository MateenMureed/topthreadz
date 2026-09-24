/**
 * social.router.ts
 * Express routes for the Social Publishing module.
 * All POST routes require an active admin session.
 * GET /status is intentionally unauthenticated so the admin UI can show
 * the setup state without a separate auth check.
 */

import { Router, Response } from 'express';
import { authenticateAdmin, authorize, AuthRequest } from '../../middleware/auth.middleware';
import { generateCaption, publishPost, getHistory, getSocialStatus } from './social.service';
import logger from '../../utils/logger';

const router = Router();

// ── GET /api/social/status ────────────────────────────────────────────────
// Returns whether Meta credentials are configured and whether the token is valid.
// Used by the frontend to show the "Connect Meta" setup state.
router.get('/status', async (_req, res: Response) => {
  try {
    const status = await getSocialStatus();
    res.json({ success: true, data: status });
  } catch (err: any) {
    logger.error('[SocialRouter] Status check error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to check Meta status.' });
  }
});

// ── POST /api/social/caption ──────────────────────────────────────────────
// Generate an AI caption + hashtags for a given product. Admin only.
router.post('/caption', authenticateAdmin, authorize('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { product } = req.body as { product: any };

    if (!product || !product.id || !product.name) {
      return res.status(400).json({ success: false, error: 'product with id and name is required.' });
    }

    const result = await generateCaption(product);
    res.json({ success: true, data: result });
  } catch (err: any) {
    logger.error('[SocialRouter] Caption generation error:', err.message);
    res.status(500).json({ success: false, error: err.message || 'Caption generation failed.' });
  }
});

// ── POST /api/social/publish ──────────────────────────────────────────────
// Publish a product post to Facebook, Instagram, or both. Admin only.
router.post('/publish', authenticateAdmin, authorize('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const {
      productId,
      productName,
      imageUrl,
      productUrl,
      caption,
      hashtags,
      platform,
      colorNames,
      category,
      priceStr,
    } = req.body as {
      productId: string;
      productName: string;
      imageUrl: string;
      productUrl: string;
      caption: string;
      hashtags: string[];
      platform: 'FACEBOOK' | 'INSTAGRAM' | 'BOTH';
      colorNames?: string[];
      category?: string;
      priceStr?: string;
    };

    // Validate required fields
    if (!productId || !imageUrl || !productUrl || !caption || !platform) {
      return res.status(400).json({
        success: false,
        error: 'productId, imageUrl, productUrl, caption, and platform are required.',
      });
    }

    if (!['FACEBOOK', 'INSTAGRAM', 'BOTH'].includes(platform)) {
      return res.status(400).json({
        success: false,
        error: 'platform must be FACEBOOK, INSTAGRAM, or BOTH.',
      });
    }

    const result = await publishPost({
      productId,
      productName: productName || 'Product',
      imageUrl,
      productUrl,
      caption,
      hashtags: Array.isArray(hashtags) ? hashtags : [],
      platform,
      colorNames: Array.isArray(colorNames) ? colorNames : [],
      category: category || '',
      priceStr: priceStr || '',
    });

    const statusCode = result.success ? 200 : 422;
    res.status(statusCode).json({ success: result.success, data: result });
  } catch (err: any) {
    logger.error('[SocialRouter] Publish error:', err.message);
    // If Meta is not configured, return a clear 422 instead of 500
    const isConfigError = err.message?.includes('not configured');
    res.status(isConfigError ? 422 : 500).json({
      success: false,
      error: err.message || 'Publish failed.',
    });
  }
});

// ── GET /api/social/history ───────────────────────────────────────────────
// Returns paginated publish history. Admin only.
router.get('/history', authenticateAdmin, authorize('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(String(req.query.page || '1'), 10);
    const limit = parseInt(String(req.query.limit || '20'), 10);
    const platform = String(req.query.platform || '');
    const status = String(req.query.status || '');

    const result = await getHistory({ page, limit, platform, status });
    res.json({ success: true, data: result });
  } catch (err: any) {
    logger.error('[SocialRouter] History fetch error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to load post history.' });
  }
});

export default router;
