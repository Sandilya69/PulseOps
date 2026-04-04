// ============================================
// PulseOps CRM - Error Handler Middleware
// ============================================

import { Request, Response, NextFunction } from 'express';

// Custom API Error class
export class ApiError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public errors?: Record<string, string[]>;

  constructor(
    statusCode: number,
    message: string,
    errors?: Record<string, string[]>,
    isOperational = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  // Factory methods for common errors
  static badRequest(message: string, errors?: Record<string, string[]>) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Forbidden — insufficient permissions') {
    return new ApiError(403, message);
  }

  static notFound(resource = 'Resource') {
    return new ApiError(404, `${resource} not found`);
  }

  static conflict(message: string) {
    return new ApiError(409, message);
  }

  static internal(message = 'Internal server error') {
    return new ApiError(500, message, undefined, false);
  }
}

// Global error handler
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors && { errors: err.errors }),
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
    return;
  }

  // Prisma known errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaErr = err as any;
    if (prismaErr.code === 'P2002') {
      const field = prismaErr.meta?.target?.[0] || 'field';
      res.status(409).json({
        success: false,
        message: `A record with this ${field} already exists`,
      });
      return;
    }
    if (prismaErr.code === 'P2025') {
      res.status(404).json({
        success: false,
        message: 'Record not found',
      });
      return;
    }
  }

  // Unexpected errors
  console.error('❌ Unhandled Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { 
      error: err.message,
      stack: err.stack 
    }),
  });
}

// 404 handler for unknown routes
export function notFoundHandler(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}
