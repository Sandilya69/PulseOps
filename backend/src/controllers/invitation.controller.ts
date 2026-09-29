// ============================================
// PulseOps CRM - Invitation Controller
// ============================================

import { Request, Response, NextFunction } from 'express';
import * as invitationService from '../services/invitation.service';
import { getParam } from '../utils/params';

/**
 * POST /api/organizations/:orgId/invitations
 */
export async function sendInvitation(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, role, message } = req.body;
    const invitation = await invitationService.sendInvitation(
      getParam(req, 'orgId'),
      email,
      role,
      message,
      req.user!
    );
    res.status(201).json({ success: true, data: invitation });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/organizations/:orgId/invitations
 */
export async function listInvitations(req: Request, res: Response, next: NextFunction) {
  try {
    const invitations = await invitationService.listInvitations(getParam(req, 'orgId'));
    res.json({ success: true, data: invitations });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/organizations/:orgId/invitations/:id
 */
export async function revokeInvitation(req: Request, res: Response, next: NextFunction) {
  try {
    await invitationService.revokeInvitation(getParam(req, 'orgId'), getParam(req, 'id'), req.user!.id);
    res.json({ success: true, message: 'Invitation revoked' });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/invitations/:token/accept (Must be mapped separately)
 */
export async function acceptInvitation(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await invitationService.acceptInvitation(getParam(req, 'token'), req.user!.id);
    res.json({ success: true, message: 'Successfully joined organization', data: result });
  } catch (error) {
    next(error);
  }
}
