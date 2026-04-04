// ============================================
// PulseOps CRM - Validation Middleware
// ============================================

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ApiError } from './errorHandler.middleware';

/**
 * Middleware factory: Validates request body against a Zod schema
 * Usage: router.post('/endpoint', validate(mySchema), controller)
 */
export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors: Record<string, string[]> = {};
        error.errors.forEach((err) => {
          const path = err.path.join('.') || 'body';
          if (!formattedErrors[path]) {
            formattedErrors[path] = [];
          }
          formattedErrors[path].push(err.message);
        });

        next(ApiError.badRequest('Validation failed', formattedErrors));
        return;
      }
      next(error);
    }
  };
}

/**
 * Middleware factory: Validates request query parameters
 */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors: Record<string, string[]> = {};
        error.errors.forEach((err) => {
          const path = err.path.join('.') || 'query';
          if (!formattedErrors[path]) {
            formattedErrors[path] = [];
          }
          formattedErrors[path].push(err.message);
        });

        next(ApiError.badRequest('Invalid query parameters', formattedErrors));
        return;
      }
      next(error);
    }
  };
}

/**
 * Middleware factory: Validates request params
 */
export function validateParams(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.params = schema.parse(req.params) as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(ApiError.badRequest('Invalid URL parameters'));
        return;
      }
      next(error);
    }
  };
}
