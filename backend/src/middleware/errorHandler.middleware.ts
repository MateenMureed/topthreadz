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
    if (err.code === 'P2002') {
      res.status(409).json({ success: false, error: 'Duplicate value conflict' });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({ success: false, error: 'Requested record not found' });
      return;
    }
    if (err.code === 'P2003') {
      logger.warn(`Foreign key constraint blocked delete on ${req.method} ${req.originalUrl}`);
      res.status(409).json({
        success: false,
        error: 'This record is linked to other data (e.g. orders) and cannot be deleted. Remove the linked records first, then try again.',
      });
      return;
    }
  }

  logger.error(`Unexpected error on ${req.method} ${req.originalUrl}`);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
  });
}
