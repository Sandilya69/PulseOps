// ============================================
// PulseOps CRM - Organization Routes
// ============================================

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { authorizePermission, authorizeOrgAccess } from '../middleware/rbac.middleware';
import * as orgController from '../controllers/organization.controller';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/organizations/:orgId — Get org details
router.get(
  '/:orgId',
  authorizeOrgAccess,
  orgController.getOrganization
);

// PUT /api/organizations/:orgId — Update org
router.put(
  '/:orgId',
  authorizeOrgAccess,
  authorizePermission('org.update'),
  orgController.updateOrganization
);

// GET /api/organizations/:orgId/stats — Get org usage stats
router.get(
  '/:orgId/stats',
  authorizeOrgAccess,
  orgController.getOrganizationStats
);

// POST /api/organizations/:orgId/transfer — Transfer ownership
router.post(
  '/:orgId/transfer',
  authorizeOrgAccess,
  authorizePermission('org.transfer_ownership'),
  orgController.transferOwnership
);

// DELETE /api/organizations/:orgId — Delete org
router.delete(
  '/:orgId',
  authorizeOrgAccess,
  authorizePermission('org.delete'),
  orgController.deleteOrganization
);

export default router;
