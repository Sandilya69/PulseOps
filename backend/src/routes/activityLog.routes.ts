// ============================================
// PulseOps CRM - Activity Log Routes
// ============================================

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { authorizeOrgAccess, authorizePermission } from '../middleware/rbac.middleware';
import * as activityLogController from '../controllers/activityLog.controller';

const router = Router({ mergeParams: true });

// GET /api/organizations/:orgId/activity-logs
router.get(
  '/:orgId/activity-logs',
  authenticateToken,
  authorizeOrgAccess,
  authorizePermission('activity.view'),
  activityLogController.listLogs
);

export default router;
