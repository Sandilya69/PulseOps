// ============================================
// PulseOps CRM - Contact Routes
// ============================================

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { authorizeOrgAccess, authorizePermission } from '../middleware/rbac.middleware';
import * as contactController from '../controllers/contact.controller';

const router = Router({ mergeParams: true });

// POST /api/organizations/:orgId/contacts
router.post(
  '/:orgId/contacts',
  authenticateToken,
  authorizeOrgAccess,
  authorizePermission('contact.create'),
  contactController.createContact
);

// GET /api/organizations/:orgId/contacts
router.get(
  '/:orgId/contacts',
  authenticateToken,
  authorizeOrgAccess,
  authorizePermission('contact.view'),
  contactController.listContacts
);

// GET /api/organizations/:orgId/contacts/:id
router.get(
  '/:orgId/contacts/:id',
  authenticateToken,
  authorizeOrgAccess,
  authorizePermission('contact.view'),
  contactController.getContact
);

// PUT /api/organizations/:orgId/contacts/:id
router.put(
  '/:orgId/contacts/:id',
  authenticateToken,
  authorizeOrgAccess,
  authorizePermission('contact.update'),
  contactController.updateContact
);

// DELETE /api/organizations/:orgId/contacts/:id
router.delete(
  '/:orgId/contacts/:id',
  authenticateToken,
  authorizeOrgAccess,
  authorizePermission('contact.delete'),
  contactController.deleteContact
);

export default router;
