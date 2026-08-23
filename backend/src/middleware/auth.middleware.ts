import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import logger from '../utils/logger';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

export function authenticate(req: AuthRequest, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Access token required');
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      next(new UnauthorizedError('Access token expired'));
    } else if (error.name === 'JsonWebTokenError') {
      next(new UnauthorizedError('Invalid access token'));
    } else {
      next(error);
    }
  }
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
