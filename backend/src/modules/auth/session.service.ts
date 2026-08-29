import { createHash, randomBytes } from 'crypto';
import { Response } from 'express';
import prisma from '../../utils/prisma';
import { env } from '../../config/env';

const ADMIN_COOKIE = '__Host-admin_session';
const USER_COOKIE = '__Host-user_session';
export const CSRF_COOKIE = 'csrf_token';
const IDLE_MS = 30 * 60 * 1000;
const ABSOLUTE_MS = 8 * 60 * 60 * 1000;

const digest = (value: string) => createHash('sha256').update(value).digest('hex');
const cookieOptions = { httpOnly: true, secure: env.NODE_ENV === 'production', sameSite: 'strict' as const, path: '/' };

export class SessionService {
  async create(userId: string, isAdmin: boolean, req: { ip?: string; headers: { [key: string]: string | string[] | undefined } }) {
    const token = randomBytes(32).toString('base64url');
    const csrfSecret = randomBytes(32).toString('base64url');
    const now = new Date();
    return {
      token,
      csrfSecret,
      session: await prisma.session.create({ data: {
        tokenHash: digest(token), userId, csrfSecret, isAdmin, createdAt: now, lastSeenAt: now,
        expiresAt: new Date(now.getTime() + ABSOLUTE_MS),
        ipHash: req.ip ? digest(req.ip) : undefined,
        userAgent: Array.isArray(req.headers['user-agent']) ? req.headers['user-agent'][0] : req.headers['user-agent'],
      } }),
    };
  }

  setCookies(res: Response, token: string, csrfSecret: string, isAdmin: boolean) {
    // No maxAge/expires: sessions end when the browser session ends.
    res.cookie(isAdmin ? ADMIN_COOKIE : USER_COOKIE, token, cookieOptions);
    res.cookie(CSRF_COOKIE, csrfSecret, { httpOnly: false, secure: env.NODE_ENV === 'production', sameSite: 'strict', path: '/' });
  }

  clearCookies(res: Response) {
    res.clearCookie(ADMIN_COOKIE, cookieOptions);
    res.clearCookie(USER_COOKIE, cookieOptions);
    res.clearCookie(CSRF_COOKIE, { secure: env.NODE_ENV === 'production', sameSite: 'strict', path: '/' });
  }

  async findValid(token: string, adminOnly = false) {
    const session = await prisma.session.findUnique({ where: { tokenHash: digest(token) }, include: { user: { select: { id: true, role: true, name: true, email: true } } } });
    if (!session || session.revokedAt || (adminOnly && !session.isAdmin)) return null;
    const now = Date.now();
    if (session.expiresAt.getTime() <= now || session.lastSeenAt.getTime() + IDLE_MS <= now) {
      await prisma.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
      return null;
    }
    // The database remains the expiry authority. Throttle writes to once per minute.
    if (now - session.lastSeenAt.getTime() > 60_000) await prisma.session.update({ where: { id: session.id }, data: { lastSeenAt: new Date() } });
    return session;
  }

  async revoke(token?: string) { if (token) await prisma.session.updateMany({ where: { tokenHash: digest(token), revokedAt: null }, data: { revokedAt: new Date() } }); }
}

export const sessionService = new SessionService();
export const sessionCookies = { ADMIN_COOKIE, USER_COOKIE };
