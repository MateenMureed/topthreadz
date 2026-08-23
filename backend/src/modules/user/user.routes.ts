import { Router } from 'express';
import { userController } from './user.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate);
router.get('/profile', userController.getProfile.bind(userController));
router.patch('/profile', userController.updateProfile.bind(userController));
router.get('/addresses', userController.getAddresses.bind(userController));
router.post('/addresses', userController.addAddress.bind(userController));
router.patch('/addresses/:addressId', userController.updateAddress.bind(userController));
router.delete('/addresses/:addressId', userController.deleteAddress.bind(userController));

export default router;
