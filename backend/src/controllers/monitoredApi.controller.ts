// ============================================
// PulseOps CRM - Monitored API Controller
// ============================================

import { Request, Response, NextFunction } from 'express';
import * as monitoredApiService from '../services/monitoredApi.service';
import { ApiError } from '../middleware/errorHandler.middleware';
import { activityLogService } from '../services/activityLog.service';
import { getParam } from '../utils/params';

/**
 * GET /api/organizations/:orgId/apis
 * List monitored APIs with filters
 */
export async function listMonitoredApis(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit, ...filters } = req.query;
    const pagination = {
      page: parseInt(page as string) || 1,
      limit: Math.min(parseInt(limit as string) || 20, 100),
    };

    const result = await monitoredApiService.listMonitoredApis(getParam(req, 'orgId'), filters, pagination);

    res.json({
      success: true,
      data: result.apis,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / pagination.limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/organizations/:orgId/apis
 * Create a new monitored API
 */
export async function createMonitoredApi(req: Request, res: Response, next: NextFunction) {
  try {
    const api = await monitoredApiService.createMonitoredApi(
      getParam(req, 'orgId'),
      req.user!.id,
      req.body
    );

    await activityLogService.log({
      orgId: getParam(req, 'orgId'),
      userId: req.user!.id,
      action: 'api.created',
      resourceType: 'api',
      resourceId: api.id,
      resourceName: api.name,
    });

    res.status(201).json({
      success: true,
      message: 'API created successfully',
      data: api,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/organizations/:orgId/apis/:id
 * Get API details with recent checks
 */
export async function getMonitoredApi(req: Request, res: Response, next: NextFunction) {
  try {
    const api = await monitoredApiService.getMonitoredApiById(getParam(req, 'orgId'), getParam(req, 'id'));
    if (!api) {
      throw ApiError.notFound('Monitored API');
    }

    res.json({ success: true, data: api });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/organizations/:orgId/apis/:id
 * Update monitored API configuration
 */
export async function updateMonitoredApi(req: Request, res: Response, next: NextFunction) {
  try {
    const api = await monitoredApiService.updateMonitoredApi(
      getParam(req, 'orgId'),
      getParam(req, 'id'),
      req.body,
      req.user!
    );

    await activityLogService.log({
      orgId: getParam(req, 'orgId'),
      userId: req.user!.id,
      action: 'api.updated',
      resourceType: 'api',
      resourceId: api.id,
      resourceName: api.name,
    });

    res.json({
      success: true,
      message: 'API updated successfully',
      data: api,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/organizations/:orgId/apis/:id
 * Delete a monitored API
 */
export async function deleteMonitoredApi(req: Request, res: Response, next: NextFunction) {
  try {
    await monitoredApiService.deleteMonitoredApi(getParam(req, 'orgId'), getParam(req, 'id'), req.user!);

    await activityLogService.log({
      orgId: getParam(req, 'orgId'),
      userId: req.user!.id,
      action: 'api.deleted',
      resourceType: 'api',
      resourceId: getParam(req, 'id'),
    });

    res.json({ success: true, message: 'API deleted successfully' });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/organizations/:orgId/apis/:id/checks
 * Get health check history for an API
 */
export async function getApiChecks(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit } = req.query;
    const pagination = {
      page: parseInt(page as string) || 1,
      limit: Math.min(parseInt(limit as string) || 50, 200),
    };

    const result = await monitoredApiService.getApiChecks(
      getParam(req, 'orgId'),
      getParam(req, 'id'),
      pagination
    );

    res.json({
      success: true,
      data: result.checks,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / pagination.limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/organizations/:orgId/apis/:id/status
 * Get current API status
 */
export async function getApiStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const status = await monitoredApiService.getApiStatus(getParam(req, 'orgId'), getParam(req, 'id'));
    res.json({ success: true, data: status });
  } catch (error) {
    next(error);
  }
}