import { Router } from 'express';
import { cartController } from './cart.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate);
router.get('/', cartController.getCart.bind(cartController));
router.post('/items', cartController.addItem.bind(cartController));
router.patch('/items/:itemId', cartController.updateItem.bind(cartController));
router.delete('/items/:itemId', cartController.removeItem.bind(cartController));
router.delete('/', cartController.clearCart.bind(cartController));

export default router;
