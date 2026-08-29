import { Router } from 'express';
import { authController } from './auth.controller';
import { validate } from '../../middleware/validate.middleware';
import { loginLimiter } from '../../middleware/rateLimiter.middleware';
import {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth.schema';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.post('/signup', validate(signupSchema), authController.signup.bind(authController));
router.post('/login', loginLimiter, validate(loginSchema), authController.login.bind(authController));
router.get('/providers', authController.providers.bind(authController));
router.get('/google', authController.googleAuth.bind(authController));
router.get('/google/callback', authController.googleCallback.bind(authController));
router.get('/facebook', authController.facebookAuth.bind(authController));
router.get('/facebook/callback', authController.facebookCallback.bind(authController));
router.post('/logout', authController.logout.bind(authController));
router.get('/session', authenticate, (req: any, res) => res.json({ success: true, data: { user: req.session.user } }));
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword.bind(authController));
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword.bind(authController));

export default router;
