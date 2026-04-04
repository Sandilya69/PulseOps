// ============================================
// PulseOps CRM - User Controller
// ============================================

import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/user.service';

/**
 * GET /api/organizations/:orgId/users — List team members
 */
export async function listUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const { orgId } = req.params;
    const { page = '1', limit = '20', role, status, search } = req.query;

    const result = await userService.listUsers(orgId, {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      role: role as string,
      status: status as string,
      search: search as string,
    });

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/organizations/:orgId/users/:userId — Get user detail
 */
export async function getUser(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await userService.getUser(req.params.userId, req.params.orgId);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/users/profile — Update own profile
 */
export async function updateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await userService.updateProfile(req.user!.id, req.body);
    res.json({ success: true, message: 'Profile updated', data: user });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/organizations/:orgId/users/:userId/role — Change role
 */
export async function changeUserRole(req: Request, res: Response, next: NextFunction) {
  try {
    await userService.changeUserRole(
      req.params.orgId,
      req.params.userId,
      req.body.role,
      req.user!
    );
    res.json({ success: true, message: 'User role updated' });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/organizations/:orgId/users/:userId/deactivate
 */
export async function deactivateUser(req: Request, res: Response, next: NextFunction) {
  try {
    await userService.setUserActiveStatus(
      req.params.orgId,
      req.params.userId,
      false,
      req.user!
    );
    res.json({ success: true, message: 'User deactivated' });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/organizations/:orgId/users/:userId/reactivate
 */
export async function reactivateUser(req: Request, res: Response, next: NextFunction) {
  try {
    await userService.setUserActiveStatus(
      req.params.orgId,
      req.params.userId,
      true,
      req.user!
    );
    res.json({ success: true, message: 'User reactivated' });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/organizations/:orgId/users/:userId — Remove user from org
 */
export async function removeUser(req: Request, res: Response, next: NextFunction) {
  try {
    await userService.removeUser(
      req.params.orgId,
      req.params.userId,
      req.user!
    );
    res.json({ success: true, message: 'User removed from organization' });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/organizations/:orgId/users/export — Export members CSV
 */
export async function exportUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const csv = await userService.exportUsersCSV(req.params.orgId);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="team-members.csv"');
    res.send(csv);
  } catch (error) {
    next(error);
  }
}
