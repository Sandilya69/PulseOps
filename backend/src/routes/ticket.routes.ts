// ============================================
// PulseOps CRM - Ticket Routes
// ============================================

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { authorizeOrgAccess, authorizePermission } from '../middleware/rbac.middleware';
import * as ticketController from '../controllers/ticket.controller';

const router = Router({ mergeParams: true });

// POST /api/organizations/:orgId/tickets
router.post(
  '/:orgId/tickets',
  authenticateToken,
  authorizeOrgAccess,
  authorizePermission('ticket.create'),
  ticketController.createTicket
);

// GET /api/organizations/:orgId/tickets
router.get(
  '/:orgId/tickets',
  authenticateToken,
  authorizeOrgAccess,
  authorizePermission('ticket.view'),
  ticketController.listTickets
);

// GET /api/organizations/:orgId/tickets/:ticketNumber
router.get(
  '/:orgId/tickets/:ticketNumber',
  authenticateToken,
  authorizeOrgAccess,
  authorizePermission('ticket.view'),
  ticketController.getTicketDetails
);

// POST /api/organizations/:orgId/tickets/:id/messages
router.post(
  '/:orgId/tickets/:id/messages',
  authenticateToken,
  authorizeOrgAccess,
  authorizePermission('ticket.view'),
  ticketController.addMessage
);

// PUT /api/organizations/:orgId/tickets/:id/status
router.put(
  '/:orgId/tickets/:id/status',
  authenticateToken,
  authorizeOrgAccess,
  authorizePermission('ticket.resolve'),
  ticketController.updateStatus
);

export default router;
