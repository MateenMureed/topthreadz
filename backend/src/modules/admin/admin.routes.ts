import { Router } from 'express';
import { adminController } from './admin.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate, authorize('ADMIN'));

// Dashboard
router.get('/dashboard', adminController.getDashboard.bind(adminController));

// Users
router.get('/users', adminController.getUsers.bind(adminController));
router.patch('/users/:id/role', adminController.updateUserRole.bind(adminController));
router.post('/users/:id/unlock', adminController.unlockUser.bind(adminController));

// Orders
router.get('/orders', adminController.getOrders.bind(adminController));
router.patch('/orders/:id/status', adminController.updateOrderStatus.bind(adminController));

// Payments
router.get('/payments/pending', adminController.getPendingPayments.bind(adminController));
router.post('/payments/:id/verify', adminController.verifyPayment.bind(adminController));

// Audit
router.get('/audit-logs', adminController.getAuditLogs.bind(adminController));

// Maintenance
router.post('/maintenance/cleanup-legacy-data', adminController.cleanupLegacyData.bind(adminController));

export default router;
