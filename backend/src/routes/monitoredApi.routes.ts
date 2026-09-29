// ============================================
// PulseOps CRM - Monitored API Routes
// ============================================

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { authorizePermission, authorizeOrgAccess } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createMonitoredApiSchema,
  updateMonitoredApiSchema,
} from '../routes/schemas/monitoredApi.schemas';
import * as monitoredApiController from '../controllers/monitoredApi.controller';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/organizations/:orgId/apis — List monitored APIs
router.get(
  '/:orgId/apis',
  authorizeOrgAccess,
  authorizePermission('api.view'),
  monitoredApiController.listMonitoredApis
);

// POST /api/organizations/:orgId/apis — Create monitored API
router.post(
  '/:orgId/apis',
  authorizeOrgAccess,
  authorizePermission('api.create'),
  validate(createMonitoredApiSchema),
  monitoredApiController.createMonitoredApi
);

// GET /api/organizations/:orgId/apis/:id — Get API details
router.get(
  '/:orgId/apis/:id',
  authorizeOrgAccess,
  authorizePermission('api.view'),
  monitoredApiController.getMonitoredApi
);

// PATCH /api/organizations/:orgId/apis/:id — Update API
router.patch(
  '/:orgId/apis/:id',
  authorizeOrgAccess,
  authorizePermission('api.update'),
  validate(updateMonitoredApiSchema),
  monitoredApiController.updateMonitoredApi
);

// DELETE /api/organizations/:orgId/apis/:id — Delete API
router.delete(
  '/:orgId/apis/:id',
  authorizeOrgAccess,
  authorizePermission('api.delete'),
  monitoredApiController.deleteMonitoredApi
);

// GET /api/organizations/:orgId/apis/:id/checks — Get health check history
router.get(
  '/:orgId/apis/:id/checks',
  authorizeOrgAccess,
  authorizePermission('api.view'),
  monitoredApiController.getApiChecks
);

// GET /api/organizations/:orgId/apis/:id/status — Get current API status
router.get(
  '/:orgId/apis/:id/status',
  authorizeOrgAccess,
  authorizePermission('api.view'),
  monitoredApiController.getApiStatus
);

export default router;