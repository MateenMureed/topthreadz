import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

const isLocalAddress = (value: string | undefined) => {
  if (!value) return false;
  const normalized = value.toLowerCase();
  return normalized.includes('127.0.0.1') || normalized.includes('::1') || normalized.includes('localhost');
};

const skipInDevelopment = (req: any) => {
  if (env.NODE_ENV !== 'production') return true;
  const ip = String(req.ip || '');
  const remoteAddress = String(req.socket?.remoteAddress || '');
  const forwardedFor = String(req.headers?.['x-forwarded-for'] || '');
  const host = String(req.headers?.host || '');
  return isLocalAddress(ip) || isLocalAddress(remoteAddress) || isLocalAddress(forwardedFor) || isLocalAddress(host);
};

export const generalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW,
  max: env.RATE_LIMIT_MAX,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  skip: skipInDevelopment,
});

export const loginLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW,
  max: env.LOGIN_RATE_LIMIT_MAX,
  message: { error: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  skipSuccessfulRequests: true,
  skip: skipInDevelopment,
});

export const paymentLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 10,
  message: { error: 'Too many payment requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  skip: skipInDevelopment,
});
