import { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import logger from '../utils/logger';

// Upstash's HTTP API keeps rate-limit counters outside ephemeral Vercel instances.
const redisConfigured = Boolean(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN);
let warnedAboutRedis = false;

function clientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  return (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0])?.trim() || req.socket.remoteAddress || 'unknown';
}

async function increment(key: string, windowSeconds: number): Promise<number> {
  const base = env.UPSTASH_REDIS_REST_URL.replace(/\/$/, '');
  const headers = { Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}` };
  const response = await fetch(`${base}/incr/${encodeURIComponent(key)}`, { headers });
  const payload = await response.json() as { result?: number };
  const count = Number(payload.result || 0);
  if (count === 1) await fetch(`${base}/expire/${encodeURIComponent(key)}/${windowSeconds}`, { headers });
  return count;
}

function createLimiter(name: string, windowMs: number, max: number) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (env.NODE_ENV !== 'production') return next();
    if (!redisConfigured) {
      if (!warnedAboutRedis) {
        warnedAboutRedis = true;
        logger.warn('Persistent rate limiting is disabled: configure UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.');
      }
      return next();
    }
    try {
      const bucket = Math.floor(Date.now() / windowMs);
      const key = `rate-limit:${name}:${clientIp(req)}:${bucket}`;
      const count = await increment(key, Math.ceil(windowMs / 1000));
      res.setHeader('RateLimit-Limit', max);
      res.setHeader('RateLimit-Remaining', Math.max(0, max - count));
      if (count > max) {
        res.status(429).json({ error: name === 'login' ? 'Too many login attempts, please try again later' : 'Too many requests, please try again later' });
        return;
      }
      next();
    } catch (error) {
      logger.error('Persistent rate limiter unavailable; allowing request', error);
      next();
    }
  };
}

export const generalLimiter = createLimiter('general', env.RATE_LIMIT_WINDOW, env.RATE_LIMIT_MAX);
export const loginLimiter = createLimiter('login', env.RATE_LIMIT_WINDOW, env.LOGIN_RATE_LIMIT_MAX);
export const paymentLimiter = createLimiter('payment', 60_000, 10);
