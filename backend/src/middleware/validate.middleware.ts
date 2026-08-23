import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { BadRequestError } from '../utils/errors';

export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const data = schema.parse(req[source]);

      if (source === 'query') {
        // Express 5 exposes req.query as getter-only, so merge instead of reassigning.
        Object.assign(req.query as Record<string, unknown>, data as Record<string, unknown>);
      } else if (source === 'params') {
        Object.assign(req.params as Record<string, unknown>, data as Record<string, unknown>);
      } else {
        req.body = data;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ');
        next(new BadRequestError(`Validation error: ${messages}`));
      } else {
        next(error);
      }
    }
  };
}
