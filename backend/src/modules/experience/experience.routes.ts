import { Router } from 'express';
import { experienceController } from './experience.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();

router.post('/analytics/events', authenticate, experienceController.trackAnalytics.bind(experienceController));

router.use(authenticate);

router.get('/wishlist', experienceController.getWishlist.bind(experienceController));
router.post('/wishlist/:productId', experienceController.toggleWishlist.bind(experienceController));

router.get('/compare', experienceController.getCompare.bind(experienceController));
router.post('/compare/:productId', experienceController.addToCompare.bind(experienceController));
router.delete('/compare/:productId', experienceController.removeFromCompare.bind(experienceController));

router.get('/saved-for-later', experienceController.getSavedForLater.bind(experienceController));
router.post('/saved-for-later', experienceController.saveForLater.bind(experienceController));
router.delete('/saved-for-later/:itemId', experienceController.removeSavedForLater.bind(experienceController));

router.get('/recently-viewed', experienceController.getRecentlyViewed.bind(experienceController));

router.post('/alerts', experienceController.createAlert.bind(experienceController));
router.get('/alerts', experienceController.getAlerts.bind(experienceController));
router.delete('/alerts/:alertId', experienceController.removeAlert.bind(experienceController));

router.get('/analytics/search-insights', authorize('ADMIN'), experienceController.getSearchInsights.bind(experienceController));
router.get('/analytics/business', authorize('ADMIN'), experienceController.getBusinessAnalytics.bind(experienceController));

export default router;
