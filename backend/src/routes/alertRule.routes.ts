// ============================================
// PulseOps CRM - Alert Rule Routes
// ============================================

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { authorizePermission, authorizeOrgAccess } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createAlertRuleSchema,
  updateAlertRuleSchema,
} from '../routes/schemas/alertRule.schemas';
import * as alertRuleController from '../controllers/alertRule.controller';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/organizations/:orgId/apis/:apiId/alert-rules — List alert rules
router.get(
  '/:orgId/apis/:apiId/alert-rules',
  authorizeOrgAccess,
  authorizePermission('api.view'),
  alertRuleController.listAlertRules
);

// POST /api/organizations/:orgId/apis/:apiId/alert-rules — Create alert rule
router.post(
  '/:orgId/apis/:apiId/alert-rules',
  authorizeOrgAccess,
  authorizePermission('api.create'),
  validate(createAlertRuleSchema),
  alertRuleController.createAlertRule
);

// PATCH /api/organizations/:orgId/alert-rules/:id — Update alert rule
router.patch(
  '/:orgId/alert-rules/:id',
  authorizeOrgAccess,
  authorizePermission('api.update'),
  validate(updateAlertRuleSchema),
  alertRuleController.updateAlertRule
);

// DELETE /api/organizations/:orgId/alert-rules/:id — Delete alert rule
router.delete(
  '/:orgId/alert-rules/:id',
  authorizeOrgAccess,
  authorizePermission('api.delete'),
  alertRuleController.deleteAlertRule
);

export default router;