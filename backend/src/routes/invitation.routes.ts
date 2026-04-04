// ============================================
// PulseOps CRM - Invitation Routes
// ============================================

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { authorizePermission, authorizeOrgAccess } from '../middleware/rbac.middleware';
import * as invitationController from '../controllers/invitation.controller';

const router = Router({ mergeParams: true });

// POST /api/organizations/:orgId/invitations
router.post(
  '/:orgId/invitations',
  authenticateToken,
  authorizeOrgAccess,
  authorizePermission('user.invite'),
  invitationController.sendInvitation
);

// GET /api/organizations/:orgId/invitations
router.get(
  '/:orgId/invitations',
  authenticateToken,
  authorizeOrgAccess,
  authorizePermission('user.view'),
  invitationController.listInvitations
);

// DELETE /api/organizations/:orgId/invitations/:id
router.delete(
  '/:orgId/invitations/:id',
  authenticateToken,
  authorizeOrgAccess,
  authorizePermission('user.invite'),
  invitationController.revokeInvitation
);

// In app.ts, you should also mount a global endpoint like router.post('/api/invitations/:token/accept', authenticateToken, acceptInvitation)

export default router;
