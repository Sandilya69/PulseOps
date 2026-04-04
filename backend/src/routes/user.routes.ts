// ============================================
// PulseOps CRM - User Routes
// ============================================

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { authorizePermission, authorizeOrgAccess } from '../middleware/rbac.middleware';
import * as userController from '../controllers/user.controller';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// ── Profile Routes (own user) ──

// PUT /api/users/profile — Update own profile
router.put('/profile', userController.updateProfile);

// ── Organization User Routes ──
// Mounted at /api/organizations/:orgId/users via app.ts re-export

export const orgUserRouter = Router({ mergeParams: true });

// GET /api/organizations/:orgId/users — List team members
orgUserRouter.get(
  '/',
  authenticateToken,
  authorizeOrgAccess,
  userController.listUsers
);

// GET /api/organizations/:orgId/users/:userId — Get user detail
orgUserRouter.get(
  '/:userId',
  authenticateToken,
  authorizeOrgAccess,
  userController.getUser
);

// PUT /api/organizations/:orgId/users/:userId/role — Change role
orgUserRouter.put(
  '/:userId/role',
  authenticateToken,
  authorizeOrgAccess,
  authorizePermission('user.change_role'),
  userController.changeUserRole
);

// PUT /api/organizations/:orgId/users/:userId/deactivate — Deactivate user
orgUserRouter.put(
  '/:userId/deactivate',
  authenticateToken,
  authorizeOrgAccess,
  authorizePermission('user.deactivate'),
  userController.deactivateUser
);

// PUT /api/organizations/:orgId/users/:userId/reactivate — Reactivate user
orgUserRouter.put(
  '/:userId/reactivate',
  authenticateToken,
  authorizeOrgAccess,
  authorizePermission('user.reactivate'),
  userController.reactivateUser
);

// DELETE /api/organizations/:orgId/users/:userId — Remove from org
orgUserRouter.delete(
  '/:userId',
  authenticateToken,
  authorizeOrgAccess,
  authorizePermission('user.remove'),
  userController.removeUser
);

// POST /api/organizations/:orgId/users/export — Export members CSV
orgUserRouter.post(
  '/export',
  authenticateToken,
  authorizeOrgAccess,
  authorizePermission('analytics.export'),
  userController.exportUsers
);

export default router;
