import { Router } from 'express';
import { orderController } from './order.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.post('/guest', orderController.createGuestOrder.bind(orderController));
router.get('/tracking/:orderNumber', orderController.getTrackingByOrderNumber.bind(orderController));

router.use(authenticate);
router.post('/', orderController.createOrder.bind(orderController));
router.get('/', orderController.getOrders.bind(orderController));
router.get('/delivery-slots', orderController.getDeliverySlots.bind(orderController));
router.get('/:id', orderController.getOrderById.bind(orderController));
router.post('/:id/returns', orderController.createReturnRequest.bind(orderController));
router.get('/:id/tracking', orderController.getTrackingByOrderId.bind(orderController));

export default router;
