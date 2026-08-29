import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
    if (!err.isOperational) {
      logger.error('Non-operational error:', err);
    }
    return;
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    logger.warn(`Prisma validation error on ${req.method} ${req.originalUrl}`);
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    logger.error(`Prisma known error ${err.code} on ${req.method} ${req.originalUrl}`);
    if (err.code === 'P2002') {
      res.status(409).json({ success: false, error: 'Duplicate value conflict' });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({ success: false, error: 'Requested record not found' });
      return;
    }
  }

  logger.error(`Unexpected error on ${req.method} ${req.originalUrl}`);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
  });
}
