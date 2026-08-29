import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import logger from '../utils/logger';
import { sessionCookies, sessionService } from '../modules/auth/session.service';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

async function authenticateWithSession(req: AuthRequest, next: NextFunction, adminOnly: boolean): Promise<void> {
  try {
    const adminToken = req.cookies?.[sessionCookies.ADMIN_COOKIE];
    const userToken = req.cookies?.[sessionCookies.USER_COOKIE];
    const token = adminOnly ? adminToken : (adminToken || userToken);
    // An unauthenticated request is normal for /auth/csrf before login.
    // Reject it cleanly instead of passing undefined into the token hash.
    if (!token) throw new UnauthorizedError('Authentication required');
    const session = await sessionService.findValid(token, adminOnly || Boolean(adminToken));
    if (!session) throw new UnauthorizedError('Authentication required');
    req.user = { userId: session.user.id, role: session.user.role };
    (req as AuthRequest & { session: typeof session }).session = session;
    next();
  } catch (error) { next(error); }
}

export function authenticate(req: AuthRequest, _res: Response, next: NextFunction): Promise<void> {
  return authenticateWithSession(req, next, false);
}

// Admin endpoints accept only the dedicated __Host-admin_session cookie.
export function authenticateAdmin(req: AuthRequest, _res: Response, next: NextFunction): Promise<void> {
  return authenticateWithSession(req, next, true);
}

export function authorize(...roles: string[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }
    if (!roles.includes(req.user.role)) {
      logger.warn(`Unauthorized access attempt by user ${req.user.userId} for role ${roles.join(', ')}`);
      return next(new ForbiddenError('Insufficient permissions'));
    }
    next();
  };
}
