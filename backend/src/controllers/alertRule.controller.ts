// ============================================
// PulseOps CRM - Alert Rule Controller
// ============================================

import { Request, Response, NextFunction } from 'express';
import * as alertRuleService from '../services/alertRule.service';
import { ApiError } from '../middleware/errorHandler.middleware';
import { activityLogService } from '../services/activityLog.service';
import { getParam } from '../utils/params';

/**
 * GET /api/organizations/:orgId/apis/:apiId/alert-rules
 * List alert rules for an API
 */
export async function listAlertRules(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit, ...filters } = req.query;
    const pagination = {
      page: parseInt(page as string) || 1,
      limit: Math.min(parseInt(limit as string) || 20, 100),
    };

    const result = await alertRuleService.listAlertRules(
      getParam(req, 'orgId'),
      getParam(req, 'apiId'),
      filters,
      pagination
    );

    res.json({
      success: true,
      data: result.rules,
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
 * POST /api/organizations/:orgId/apis/:apiId/alert-rules
 * Create a new alert rule
 */
export async function createAlertRule(req: Request, res: Response, next: NextFunction) {
  try {
    const rule = await alertRuleService.createAlertRule(
      getParam(req, 'orgId'),
      getParam(req, 'apiId'),
      req.user!.id,
      req.body
    );

    await activityLogService.log({
      orgId: getParam(req, 'orgId'),
      userId: req.user!.id,
      action: 'alert_rule.created',
      resourceType: 'alert_rule',
      resourceId: rule.id,
      resourceName: rule.triggerType,
      metadata: { apiId: getParam(req, 'apiId') },
    });

    res.status(201).json({
      success: true,
      message: 'Alert rule created successfully',
      data: rule,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/organizations/:orgId/alert-rules/:id
 * Update an alert rule
 */
export async function updateAlertRule(req: Request, res: Response, next: NextFunction) {
  try {
    const rule = await alertRuleService.updateAlertRule(
      getParam(req, 'orgId'),
      getParam(req, 'id'),
      req.body,
      req.user!
    );

    await activityLogService.log({
      orgId: getParam(req, 'orgId'),
      userId: req.user!.id,
      action: 'alert_rule.updated',
      resourceType: 'alert_rule',
      resourceId: rule.id,
      resourceName: rule.triggerType,
    });

    res.json({
      success: true,
      message: 'Alert rule updated successfully',
      data: rule,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/organizations/:orgId/alert-rules/:id
 * Delete an alert rule
 */
export async function deleteAlertRule(req: Request, res: Response, next: NextFunction) {
  try {
    await alertRuleService.deleteAlertRule(getParam(req, 'orgId'), getParam(req, 'id'), req.user!);

    await activityLogService.log({
      orgId: getParam(req, 'orgId'),
      userId: req.user!.id,
      action: 'alert_rule.deleted',
      resourceType: 'alert_rule',
      resourceId: getParam(req, 'id'),
    });

    res.json({ success: true, message: 'Alert rule deleted successfully' });
  } catch (error) {
    next(error);
  }
}