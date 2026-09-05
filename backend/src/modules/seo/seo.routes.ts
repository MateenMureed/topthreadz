import { Router } from 'express';
import { SeoController } from './seo.controller';
import { authenticateAdmin, authorize } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { generateSeoSchema } from './seo.schema';
import { seoLimiter } from '../../middleware/rateLimiter.middleware';

const router = Router();
const seoController = new SeoController();

// POST /api/products/generate-seo
// Generates SEO content with AI. Admin-only. Response is never persisted by
// this route — the admin reviews it in the form and saves via the normal
// product create/update flow.
router.post(
  '/generate-seo',
  authenticateAdmin,
  authorize('ADMIN'),
  seoLimiter,
  validate(generateSeoSchema),
  seoController.generate.bind(seoController)
);

export default router;
