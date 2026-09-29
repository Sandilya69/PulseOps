// ============================================
// PulseOps CRM - Incident Controller
// ============================================

import { Request, Response, NextFunction } from 'express';
import * as incidentService from '../services/incident.service';
import { ApiError } from '../middleware/errorHandler.middleware';
import { activityLogService } from '../services/activityLog.service';
import { incidentFiltersSchema } from '../routes/schemas/incident.schemas';

function getParam(req: Request, key: string): string {
  const val = req.params[key];
  return Array.isArray(val) ? val[0] : val;
}

/**
 * GET /api/organizations/:orgId/incidents
 * List incidents with filters
 */
export async function listIncidents(req: Request, res: Response, next: NextFunction) {
  try {
    const filters = incidentFiltersSchema.parse(req.query);
    const { page, limit, ...whereFilters } = filters;

    const [incidents, total] = await Promise.all([
      incidentService.listIncidents(getParam(req, 'orgId'), whereFilters, { page, limit }),
      incidentService.countIncidents(getParam(req, 'orgId'), whereFilters),
    ]);

    res.json({
      success: true,
      data: incidents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/organizations/:orgId/incidents
 * Create a new incident manually
 */
export async function createIncident(req: Request, res: Response, next: NextFunction) {
  try {
    const incident = await incidentService.createIncident(
      getParam(req, 'orgId'),
      req.user!.id,
      req.body
    );

    res.status(201).json({
      success: true,
      message: 'Incident created successfully',
      data: incident,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/organizations/:orgId/incidents/:id
 * Get incident details with timeline
 */
export async function getIncident(req: Request, res: Response, next: NextFunction) {
  try {
    const incident = await incidentService.getIncidentById(getParam(req, 'orgId'), getParam(req, 'id'));
    if (!incident) {
      throw ApiError.notFound('Incident');
    }

    res.json({ success: true, data: incident });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/organizations/:orgId/incidents/:id/ack
 * Acknowledge an incident
 */
export async function acknowledgeIncident(req: Request, res: Response, next: NextFunction) {
  try {
    const incident = await incidentService.updateIncidentStatus(
      getParam(req, 'orgId'),
      getParam(req, 'id'),
      req.user!.id,
      'acknowledged',
      req.body.notes
    );

    await activityLogService.log({
      orgId: getParam(req, 'orgId'),
      userId: req.user!.id,
      action: 'incident.acknowledged',
      resourceType: 'incident',
      resourceId: incident.id,
      resourceName: incident.title,
    });

    res.json({
      success: true,
      message: 'Incident acknowledged',
      data: incident,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/organizations/:orgId/incidents/:id/resolve
 * Resolve an incident
 */
export async function resolveIncident(req: Request, res: Response, next: NextFunction) {
  try {
    const incident = await incidentService.updateIncidentStatus(
      getParam(req, 'orgId'),
      getParam(req, 'id'),
      req.user!.id,
      'resolved',
      req.body.notes
    );

    await activityLogService.log({
      orgId: getParam(req, 'orgId'),
      userId: req.user!.id,
      action: 'incident.resolved',
      resourceType: 'incident',
      resourceId: incident.id,
      resourceName: incident.title,
    });

    res.json({
      success: true,
      message: 'Incident resolved',
      data: incident,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/organizations/:orgId/incidents/:id/escalate
 * Manually escalate an incident
 */
export async function escalateIncident(req: Request, res: Response, next: NextFunction) {
  try {
    const incident = await incidentService.escalateIncident(
      getParam(req, 'orgId'),
      getParam(req, 'id'),
      req.user!.id,
      req.body.notes
    );

    if (!incident) {
      throw ApiError.notFound('Incident');
    }

    await activityLogService.log({
      orgId: getParam(req, 'orgId'),
      userId: req.user!.id,
      action: 'incident.escalated',
      resourceType: 'incident',
      resourceId: incident.id,
      resourceName: incident.title,
    });

    res.json({
      success: true,
      message: 'Incident escalated',
      data: incident,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/organizations/:orgId/incidents/:id/notes
 * Add a note to incident timeline
 */
export async function addIncidentNote(req: Request, res: Response, next: NextFunction) {
  try {
    const note = await incidentService.addTimelineEvent(
      getParam(req, 'orgId'),
      getParam(req, 'id'),
      req.user!.id,
      req.body.content,
      req.body.isPublic
    );

    await activityLogService.log({
      orgId: getParam(req, 'orgId'),
      userId: req.user!.id,
      action: 'incident.note_add',
      resourceType: 'incident',
      resourceId: getParam(req, 'id'),
      metadata: { isPublic: req.body.isPublic },
    });

    res.status(201).json({
      success: true,
      message: 'Note added to incident timeline',
      data: note,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/organizations/:orgId/incidents/:id/timeline
 * Get full incident timeline
 */
export async function getIncidentTimeline(req: Request, res: Response, next: NextFunction) {
  try {
    const timeline = await incidentService.getIncidentTimeline(getParam(req, 'orgId'), getParam(req, 'id'));
    res.json({ success: true, data: timeline });
  } catch (error) {
    next(error);
  }
}