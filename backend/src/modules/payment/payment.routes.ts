import { Router } from 'express';
import { paymentController } from './payment.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { paymentLimiter } from '../../middleware/rateLimiter.middleware';

const router = Router();

router.post('/initiate', authenticate, paymentLimiter, paymentController.initiatePayment.bind(paymentController));
router.post('/initiate-guest', paymentLimiter, paymentController.initiateGuestPayment.bind(paymentController));
router.get('/verify/:orderId', authenticate, paymentController.verifyPayment.bind(paymentController));
router.all('/callback/:provider', paymentController.handleCallback.bind(paymentController));
router.post('/webhook/:provider', paymentController.handleWebhook.bind(paymentController));

export default router;
