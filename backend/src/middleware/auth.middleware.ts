// ============================================
// PulseOps CRM - Auth Middleware
// ============================================

import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { ApiError } from './errorHandler.middleware';
import prisma from '../lib/prisma';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        orgId: string;
        email: string;
        name: string;
        role: import('@prisma/client').UserRole;
      };
    }
  }
}

/**
 * Middleware to validate JWT token and attach user to request
 */
export async function authenticateToken(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;

    if (!token) {
      throw ApiError.unauthorized('Access token is required');
    }

    const decoded = verifyAccessToken(token);
    if (!decoded || !decoded.userId) {
      throw ApiError.unauthorized('Invalid or expired access token');
    }

    // Fetch fresh user from DB (ensures deactivated users are blocked)
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        orgId: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      throw ApiError.unauthorized('User not found');
    }

    if (!user.isActive) {
      throw ApiError.forbidden('Account is deactivated. Contact your admin.');
    }

    // Update last active timestamp (fire-and-forget)
    prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    }).catch(() => {}); // Silently fail — non-critical

    // Attach user to request
    req.user = {
      id: user.id,
      orgId: user.orgId,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      next(ApiError.unauthorized('Invalid or expired access token'));
    }
  }
}

/**
 * Optional auth — attaches user if token exists, but doesn't block
 */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;

    if (token) {
      const decoded = verifyAccessToken(token);
      if (decoded?.userId) {
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId, isActive: true },
          select: { id: true, orgId: true, email: true, name: true, role: true },
        });
        if (user) req.user = user;
      }
    }
  } catch {
    // Silently continue — optional auth
  }
  next();
}
