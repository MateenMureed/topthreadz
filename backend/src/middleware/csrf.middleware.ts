import { NextFunction, Request, Response } from 'express';
import { ForbiddenError } from '../utils/errors';
import { CSRF_COOKIE, sessionCookies, sessionService } from '../modules/auth/session.service';

const SAFE = new Set(['GET', 'HEAD', 'OPTIONS']);
const EXEMPT = new Set(['/api/auth/login', '/api/auth/signup', '/api/auth/forgot-password', '/api/auth/reset-password']);

export async function csrfProtection(req: Request, _res: Response, next: NextFunction): Promise<void> {
  if (SAFE.has(req.method) || EXEMPT.has(req.path)) return next();
  // Native mobile applications sending Bearer authorization headers are not subject to browser CSRF
  if (req.headers.authorization?.startsWith('Bearer ')) return next();
  const token = req.cookies?.[sessionCookies.ADMIN_COOKIE] || req.cookies?.[sessionCookies.USER_COOKIE];
  if (!token) return next(); // Auth middleware will reject a protected endpoint.
  const provided = req.get('X-CSRF-Token');
  const session = await sessionService.findValid(token, Boolean(req.cookies?.[sessionCookies.ADMIN_COOKIE]));
  if (!session || !provided || provided !== req.cookies?.[CSRF_COOKIE] || provided !== session.csrfSecret) {
    return next(new ForbiddenError('Invalid CSRF token'));
  }
  next();
}
