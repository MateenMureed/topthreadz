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
import categoryRoutes from './modules/category/category.routes';
import cartRoutes from './modules/cart/cart.routes';
import orderRoutes from './modules/order/order.routes';
import paymentRoutes from './modules/payment/payment.routes';
import adminRoutes from './modules/admin/admin.routes';
import experienceRoutes from './modules/experience/experience.routes';
import { adminController } from './modules/admin/admin.controller';
import { upload } from './middleware/upload.middleware';
import { recommendationService } from './modules/product/recommendation.service';
import { authenticate, authenticateAdmin, authorize, AuthRequest } from './middleware/auth.middleware';
import { csrfProtection } from './middleware/csrf.middleware';

const app = express();
app.set('trust proxy', 1);
const productionOrigins = new Set([
  'https://www.topthreadz.com.pk',
  'https://topthreadz.com.pk',
]);
const developmentOrigins = [...env.CORS_ORIGIN.split(','), env.FRONTEND_URL]
  .map((origin) => origin.trim().replace(/\/+$/, ''))
  .filter(Boolean);

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  hsts: env.NODE_ENV === 'production' ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
  contentSecurityPolicy: { directives: {
    defaultSrc: ["'self'"], baseUri: ["'self'"], objectSrc: ["'none'"], frameAncestors: ["'none'"],
    imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com'],
    connectSrc: ["'self'", ...productionOrigins, ...developmentOrigins, 'https://*.cloudinary.com'],
    scriptSrc: ["'self'"], styleSrc: ["'self'", "'unsafe-inline'"],
    upgradeInsecureRequests: env.NODE_ENV === 'production' ? [] : null,
  } },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }
    const cleanOrigin = origin.trim().replace(/\/+$/, '');
    const permitted = env.NODE_ENV === 'production'
      ? productionOrigins.has(cleanOrigin)
      : developmentOrigins.includes(cleanOrigin) || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(cleanOrigin);
    if (permitted) {
      callback(null, true);
      return;
    }
    logger.warn(`Blocked CORS origin: ${origin}`);
    callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-Requested-With', 'X-CSRF-Token'],
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
app.use(csrfProtection);
app.use((req, res, next) => {
  res.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=(self)');
  if (req.path.startsWith('/api/admin') || req.path.startsWith('/api/users') || req.path.startsWith('/api/orders') || req.path.startsWith('/api/payments')) res.set('Cache-Control', 'private, no-store');
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/experience', experienceRoutes);

app.get('/api/settings/hero-banner', adminController.getHeroBanner.bind(adminController));
app.post('/api/settings/hero-banner', authenticateAdmin, authorize('ADMIN'), upload.single('image'), adminController.uploadHeroBanner.bind(adminController));
app.delete('/api/settings/hero-banner', authenticateAdmin, authorize('ADMIN'), adminController.deleteHeroBanner.bind(adminController));

app.get('/api/settings/store', adminController.getStoreSettings.bind(adminController));
app.put('/api/settings/store', authenticateAdmin, authorize('ADMIN'), adminController.updateStoreSettings.bind(adminController));

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
