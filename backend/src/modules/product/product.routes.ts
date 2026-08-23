import { Router } from 'express';
import { productController } from './product.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createProductSchema, updateProductSchema, productQuerySchema } from './product.schema';
import { upload } from '../../middleware/upload.middleware';

const router = Router();

// Public routes
router.get('/', validate(productQuerySchema, 'query'), productController.findAll.bind(productController));
router.get('/categories', productController.getCategories.bind(productController));
router.get('/suggestions', productController.searchSuggestions.bind(productController));
router.get('/popular-searches', productController.getPopularSearches.bind(productController));
router.get('/ai-search', productController.aiSearch.bind(productController));
router.get('/slug/:slug', productController.findBySlug.bind(productController));
router.get('/:id/upsell', productController.getUpsellSuggestions.bind(productController));
router.get('/:id', productController.findById.bind(productController));

// Authenticated routes
router.post('/:id/view', authenticate, productController.recordView.bind(productController));

// Admin routes
router.post('/upload-images', authenticate, authorize('ADMIN'), upload.array('images', 10), productController.uploadImages.bind(productController));
router.post('/', authenticate, authorize('ADMIN'), validate(createProductSchema), productController.create.bind(productController));
router.patch('/:id', authenticate, authorize('ADMIN'), validate(updateProductSchema), productController.update.bind(productController));
router.delete('/:id', authenticate, authorize('ADMIN'), productController.delete.bind(productController));

export default router;
