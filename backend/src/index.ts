import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { env } from './config/env';
import { generalLimiter } from './middleware/rateLimiter.middleware';
import { errorHandler } from './middleware/errorHandler.middleware';
import logger from './utils/logger';
import prisma from './utils/prisma';

// Route imports
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/user/user.routes';
import productRoutes from './modules/product/product.routes';
import cartRoutes from './modules/cart/cart.routes';
import orderRoutes from './modules/order/order.routes';
import paymentRoutes from './modules/payment/payment.routes';
import adminRoutes from './modules/admin/admin.routes';
import experienceRoutes from './modules/experience/experience.routes';

// Recommendation endpoint
import { recommendationService } from './modules/product/recommendation.service';
import { authenticate, AuthRequest } from './middleware/auth.middleware';

const app = express();
const allowedOrigins = [
  ...env.CORS_ORIGIN.split(','),
  env.FRONTEND_URL,
].map(origin => origin.trim()).filter(Boolean);

const isLocalDevOrigin = (origin: string) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);

// ====== SECURITY ======
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  origin: (origin, callback) => {
    if (env.NODE_ENV !== 'production') {
      // In local development, allow all browser origins to prevent CORS false positives.
      callback(null, true);
      return;
    }

    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin) || /\.vercel\.app$/i.test(origin) || isLocalDevOrigin(origin)) {
      callback(null, true);
      return;
    }

    logger.warn(`Blocked CORS origin: ${origin}`);
    callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));
app.use(generalLimiter);

// ====== PARSING ======
app.use(express.json({ limit: '10mb', verify: (req, _res, buffer) => { (req as typeof req & { rawBody?: Buffer }).rawBody = buffer; } }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ====== STATIC FILES ======
const uploadsDir = path.join(__dirname, '..', env.UPLOAD_DIR);
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// Create logs directory
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

// ====== API ROUTES ======
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/experience', experienceRoutes);

// Recommendation endpoints
app.get('/api/recommendations', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const products = await recommendationService.getRecommendations(req.user!.userId);
    res.json({ success: true, data: products });
  } catch (error) { next(error); }
});

app.get('/api/products/:id/similar', async (req, res, next) => {
  try {
    const products = await recommendationService.getSimilarProducts(req.params.id);
    res.json({ success: true, data: products });
  } catch (error) { next(error); }
});

// Root Endpoint
app.get('/', (_req, res) => {
  res.json({
    name: 'TopThreadz eCommerce API',
    status: 'online',
    healthCheck: '/api/health',
    timestamp: new Date().toISOString(),
  });
});

// Health check
app.get('/api/health', async (_req, res) => {
  let dbStatus = 'disconnected';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch {
    dbStatus = 'error';
  }

  res.json({
    status: 'ok',
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

// ====== ERROR HANDLING ======
app.use(errorHandler);

// ====== START SERVER ======
app.listen(env.PORT, '0.0.0.0', () => {
  logger.info(`🚀 Server running on port ${env.PORT} on 0.0.0.0 in ${env.NODE_ENV} mode`);
});

export default app;
