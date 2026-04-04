// ============================================
// PulseOps CRM - RBAC Middleware
// ============================================

import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { hasPermission, Permission } from '../lib/permissions';
import { ApiError } from './errorHandler.middleware';

/**
 * Middleware: Check if authenticated user has a specific permission
 * Usage: router.delete('/api', authorizePermission('api.delete'), controller)
 */
export function authorizePermission(permission: Permission) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(ApiError.unauthorized());
      return;
    }

    if (!hasPermission(req.user.role, permission)) {
      next(
        ApiError.forbidden(
          `You don't have permission to perform this action (requires: ${permission})`
        )
      );
      return;
    }

    next();
  };
}

/**
 * Middleware: Check if user has one of the specified roles
 * Usage: router.put('/org', authorizeRole('owner', 'admin'), controller)
 */
export function authorizeRole(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(ApiError.unauthorized());
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(
        ApiError.forbidden(
          `This action requires one of these roles: ${allowedRoles.join(', ')}`
        )
      );
      return;
    }

    next();
  };
}

/**
 * Middleware: Ensure the user belongs to the organization in the route params
 * Usage: router.get('/organizations/:orgId/...', authorizeOrgAccess, controller)
 */
export function authorizeOrgAccess(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    next(ApiError.unauthorized());
    return;
  }

  const orgId = req.params.orgId;
  if (orgId && req.user.orgId !== orgId) {
    next(ApiError.forbidden('You do not have access to this organization'));
    return;
  }

  next();
}
