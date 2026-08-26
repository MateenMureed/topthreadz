import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { generalLimiter } from './middleware/rateLimiter.middleware';
import { errorHandler } from './middleware/errorHandler.middleware';
import logger from './utils/logger';
import prisma from './utils/prisma';
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/user/user.routes';
import productRoutes from './modules/product/product.routes';
import cartRoutes from './modules/cart/cart.routes';
import orderRoutes from './modules/order/order.routes';
import paymentRoutes from './modules/payment/payment.routes';
import adminRoutes from './modules/admin/admin.routes';
import experienceRoutes from './modules/experience/experience.routes';
import { adminController } from './modules/admin/admin.controller';
import { upload } from './middleware/upload.middleware';
import { recommendationService } from './modules/product/recommendation.service';
import { authenticate, authorize, AuthRequest } from './middleware/auth.middleware';

const app = express();
app.set('trust proxy', 1);
const allowedOrigins = [...env.CORS_ORIGIN.split(','), env.FRONTEND_URL]
  .map((origin) => origin.trim().replace(/\/+$/, ''))
  .filter(Boolean);
const isLocalDevOrigin = (origin: string) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
const isVercelDomain = (origin: string) => /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin);
const isTopThreadzDomain = (origin: string) => /^https:\/\/(.*\.)?topthreadz\.com\.pk$/i.test(origin);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }
    const cleanOrigin = origin.trim().replace(/\/+$/, '');
    if (
      env.NODE_ENV !== 'production' ||
      allowedOrigins.includes(cleanOrigin) ||
      isLocalDevOrigin(cleanOrigin) ||
      isVercelDomain(cleanOrigin) ||
      isTopThreadzDomain(cleanOrigin)
    ) {
      callback(null, true);
      return;
    }
    logger.warn(`Blocked CORS origin: ${origin}`);
    callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.get('/favicon.ico', (_req, res) => res.status(204).end());

// Path normalizer: ensure requests without /api prefix (e.g. /products or /auth/login) are automatically routed to /api/*
app.use((req, _res, next) => {
  if (!req.url.startsWith('/api') && req.url !== '/' && !req.url.startsWith('/favicon.ico')) {
    req.url = '/api' + req.url;
  }
  next();
});

app.use(generalLimiter);
app.use(express.json({ limit: '10mb', verify: (req, _res, buffer) => { (req as typeof req & { rawBody?: Buffer }).rawBody = buffer; } }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/experience', experienceRoutes);

app.get('/api/settings/hero-banner', adminController.getHeroBanner.bind(adminController));
app.post('/api/settings/hero-banner', authenticate, authorize('ADMIN'), upload.single('image'), adminController.uploadHeroBanner.bind(adminController));
app.delete('/api/settings/hero-banner', authenticate, authorize('ADMIN'), adminController.deleteHeroBanner.bind(adminController));

app.get('/api/settings/store', adminController.getStoreSettings.bind(adminController));
app.put('/api/settings/store', authenticate, authorize('ADMIN'), adminController.updateStoreSettings.bind(adminController));

app.get('/api/recommendations', authenticate, async (req: AuthRequest, res, next) => {
  try { res.json({ success: true, data: await recommendationService.getRecommendations(req.user!.userId) }); }
  catch (error) { next(error); }
});
app.get('/api/products/:id/similar', async (req, res, next) => {
  try { res.json({ success: true, data: await recommendationService.getSimilarProducts(req.params.id) }); }
  catch (error) { next(error); }
});
app.get('/', (_req, res) => res.json({
  name: 'TopThreadz eCommerce API', status: 'online', healthCheck: '/api/health', timestamp: new Date().toISOString(),
}));
app.get('/api/health', async (_req, res) => {
  let dbStatus = 'disconnected';
  try { await prisma.$queryRaw`SELECT 1`; dbStatus = 'connected'; } catch (error) { logger.error('Health database check failed', error); dbStatus = 'error'; }
  res.status(dbStatus === 'connected' ? 200 : 503).json({ status: dbStatus === 'connected' ? 'ok' : 'error', database: dbStatus, timestamp: new Date().toISOString() });
});

app.use(errorHandler);
export default app;
