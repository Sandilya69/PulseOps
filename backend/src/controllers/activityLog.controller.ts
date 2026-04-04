// ============================================
// PulseOps CRM - Activity Log Controller
// ============================================

import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';

/**
 * GET /api/organizations/:orgId/activity-logs
 * List activity logs for an organization
 */
export async function listLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const { orgId } = req.params;
    const { page = '1', limit = '50', userId, action, resourceType, search } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where: any = { orgId };

    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (resourceType) where.resourceType = resourceType;
    if (search) {
      where.OR = [
        { resourceName: { contains: search as string, mode: 'insensitive' } },
        { action: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.activityLog.count({ where }),
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: {
        page: parseInt(page as string),
        limit: take,
        total,
        totalPages: Math.ceil(total / take)
      }
    });

  } catch (error) {
    next(error);
  }
}
