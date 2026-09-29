// ============================================
// PulseOps CRM - Incident Routes
// ============================================

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { authorizePermission, authorizeOrgAccess } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createIncidentSchema,
  updateIncidentStatusSchema,
  addIncidentNoteSchema,
} from '../routes/schemas/incident.schemas';
import * as incidentController from '../controllers/incident.controller';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/organizations/:orgId/incidents — List incidents with filters
router.get(
  '/:orgId/incidents',
  authorizeOrgAccess,
  authorizePermission('incident.view'),
  incidentController.listIncidents
);

// POST /api/organizations/:orgId/incidents — Create incident manually
router.post(
  '/:orgId/incidents',
  authorizeOrgAccess,
  authorizePermission('incident.create'),
  validate(createIncidentSchema),
  incidentController.createIncident
);

// GET /api/organizations/:orgId/incidents/:id — Get incident details
router.get(
  '/:orgId/incidents/:id',
  authorizeOrgAccess,
  authorizePermission('incident.view'),
  incidentController.getIncident
);

// PATCH /api/organizations/:orgId/incidents/:id/ack — Acknowledge incident
router.patch(
  '/:orgId/incidents/:id/ack',
  authorizeOrgAccess,
  authorizePermission('incident.acknowledge'),
  validate(updateIncidentStatusSchema),
  incidentController.acknowledgeIncident
);

// PATCH /api/organizations/:orgId/incidents/:id/resolve — Resolve incident
router.patch(
  '/:orgId/incidents/:id/resolve',
  authorizeOrgAccess,
  authorizePermission('incident.resolve'),
  validate(updateIncidentStatusSchema),
  incidentController.resolveIncident
);

// PATCH /api/organizations/:orgId/incidents/:id/escalate — Escalate incident
router.patch(
  '/:orgId/incidents/:id/escalate',
  authorizeOrgAccess,
  authorizePermission('incident.resolve'),
  validate(updateIncidentStatusSchema),
  incidentController.escalateIncident
);

// POST /api/organizations/:orgId/incidents/:id/notes — Add note to timeline
router.post(
  '/:orgId/incidents/:id/notes',
  authorizeOrgAccess,
  authorizePermission('incident.note_add'),
  validate(addIncidentNoteSchema),
  incidentController.addIncidentNote
);

// GET /api/organizations/:orgId/incidents/:id/timeline — Get incident timeline
router.get(
  '/:orgId/incidents/:id/timeline',
  authorizeOrgAccess,
  authorizePermission('incident.view'),
  incidentController.getIncidentTimeline
);

export default router;