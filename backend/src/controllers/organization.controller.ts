// ============================================
// PulseOps CRM - Organization Controller
// ============================================

import { Request, Response, NextFunction } from 'express';
import * as orgService from '../services/organization.service';

/**
 * GET /api/organizations/:orgId
 */
export async function getOrganization(req: Request, res: Response, next: NextFunction) {
  try {
    const org = await orgService.getOrganization(req.params.orgId);
    res.json({ success: true, data: org });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/organizations/:orgId
 */
export async function updateOrganization(req: Request, res: Response, next: NextFunction) {
  try {
    const org = await orgService.updateOrganization(
      req.params.orgId,
      req.body,
      req.user!
    );
    res.json({ success: true, message: 'Organization updated', data: org });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/organizations/:orgId/stats
 */
export async function getOrganizationStats(req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await orgService.getOrganizationStats(req.params.orgId);
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/organizations/:orgId/transfer
 */
export async function transferOwnership(req: Request, res: Response, next: NextFunction) {
  try {
    await orgService.transferOwnership(
      req.params.orgId,
      req.body.newOwnerId,
      req.user!
    );
    res.json({ success: true, message: 'Ownership transferred successfully' });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/organizations/:orgId
 */
export async function deleteOrganization(req: Request, res: Response, next: NextFunction) {
  try {
    await orgService.deleteOrganization(req.params.orgId, req.user!);
    res.json({ success: true, message: 'Organization deleted' });
  } catch (error) {
    next(error);
  }
}
