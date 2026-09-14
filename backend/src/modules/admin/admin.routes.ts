import { Router } from 'express';
import { adminController } from './admin.controller';
import { authenticateAdmin, authorize } from '../../middleware/auth.middleware';
import { upload } from '../../middleware/upload.middleware';

const router = Router();

// ── Public: settings & hero banner (no auth needed) ──────────────────
router.get('/settings/hero-banner', adminController.getHeroBanner.bind(adminController));
router.get('/settings/hero-banner-mobile', adminController.getHeroBannerMobile.bind(adminController));
router.get('/settings/hero-banner-text', adminController.getHeroBannerText.bind(adminController));
router.get('/hero-banners', adminController.listHeroBanners.bind(adminController));
router.get('/settings/store', adminController.getStoreSettings.bind(adminController));
// Homepage settings — public so the frontend can read without auth
router.get('/settings/homepage', adminController.getHomepageSettings.bind(adminController));

// ── Admin-only routes ────────────────────────────────────────────────
router.use(authenticateAdmin, authorize('ADMIN'));

// Dashboard
router.get('/dashboard', adminController.getDashboard.bind(adminController));

// Users
router.get('/users', adminController.getUsers.bind(adminController));
router.patch('/users/:id/role', adminController.updateUserRole.bind(adminController));
router.post('/users/:id/unlock', adminController.unlockUser.bind(adminController));

// Admin Accounts (secondary admin management; primary admin is protected server-side)
router.get('/admins', adminController.listAdmins.bind(adminController));
router.post('/admins', adminController.createAdminAccount.bind(adminController));
router.delete('/admins/:id', adminController.deleteAdminAccount.bind(adminController));

// Orders
router.get('/orders', adminController.getOrders.bind(adminController));
router.patch('/orders/:id/status', adminController.updateOrderStatus.bind(adminController));
router.delete('/orders/:id', adminController.deleteOrder.bind(adminController));

// Payments
router.get('/payments/pending', adminController.getPendingPayments.bind(adminController));
router.post('/payments/:id/verify', adminController.verifyPayment.bind(adminController));

// Audit
router.get('/audit-logs', adminController.getAuditLogs.bind(adminController));

// Maintenance
router.post('/maintenance/cleanup-legacy-data', adminController.cleanupLegacyData.bind(adminController));

// Hero Banner & Store Settings (admin upload/update)
router.post('/settings/hero-banner', upload.single('image'), adminController.uploadHeroBanner.bind(adminController));
router.delete('/settings/hero-banner', adminController.deleteHeroBanner.bind(adminController));
router.post('/settings/hero-banner-mobile', upload.single('image'), adminController.uploadHeroBannerMobile.bind(adminController));
router.delete('/settings/hero-banner-mobile', adminController.deleteHeroBannerMobile.bind(adminController));
router.post('/settings/hero-banner-text', adminController.updateHeroBannerText.bind(adminController));
router.post('/hero-banners', upload.single('image'), adminController.createHeroBanner.bind(adminController));
router.get('/hero-banners/manage', adminController.listAdminHeroBanners.bind(adminController));
router.patch('/hero-banners/:id', upload.single('image'), adminController.updateHeroBanner.bind(adminController));
router.delete('/hero-banners/:id', adminController.removeHeroBanner.bind(adminController));
router.put('/settings/store', adminController.updateStoreSettings.bind(adminController));

// Homepage settings (admin write)
router.put('/settings/homepage', adminController.updateHomepageSettings.bind(adminController));
router.post('/settings/homepage/upload', upload.single('image'), adminController.uploadHomepageImage.bind(adminController));

export default router;

