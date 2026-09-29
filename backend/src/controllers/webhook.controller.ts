// ============================================
// PulseOps CRM - Webhook Controller
// ============================================

import { Request, Response, NextFunction } from 'express';
import { normalizeAlert } from '../services/alertNormalizer.service';
import { checkAndSetDedup } from '../services/redis.dedup';
import { createIncident } from '../services/incident.service';
import { ApiError } from '../middleware/errorHandler.middleware';
import { getParam } from '../utils/params';
import crypto from 'crypto';

/**
 * POST /api/webhooks/alerts/:sourceId
 * Generic webhook endpoint with HMAC validation
 */
export async function receiveAlert(req: Request, res: Response, next: NextFunction) {
  try {
    const sourceId = req.params.sourceId;
    const sourceType = req.webhookSource?.sourceType || 'custom';
    
    // Normalize the alert
    const normalized = normalizeAlert(sourceType, req.body);
    const alerts = Array.isArray(normalized) ? normalized : [normalized];

    const results = [];
    
    for (const alert of alerts) {
      // Check deduplication
      const isNew = await checkAndSetDedup(alert.fingerprint, 300); // 5 min TTL
      
      if (!isNew) {
        results.push({ fingerprint: alert.fingerprint, status: 'duplicate', skipped: true });
        continue;
      }

      // Create incident
      // Get orgId from webhook source or default
      const orgId = req.webhookSource?.id || 'default-org';
      
      // Find or create a system user for webhook alerts
      const incident = await createIncident(
        orgId,
        'system-webhook',
        {
          title: alert.title,
          description: alert.description,
          severity: alert.severity,
          // apiId can be added later if we match by service name
        }
      );

      results.push({ 
        fingerprint: alert.fingerprint, 
        status: 'created', 
        incidentId: incident.id 
      });
    }

    res.json({ 
      success: true, 
      received: alerts.length,
      results 
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/webhooks/datadog
 * Datadog-specific webhook endpoint
 */
export async function receiveDatadogAlert(req: Request, res: Response, next: NextFunction) {
  try {
    const normalized = normalizeAlert('datadog', req.body);
    const alerts = Array.isArray(normalized) ? normalized : [normalized];

    const results = [];
    
    for (const alert of alerts) {
      const isNew = await checkAndSetDedup(alert.fingerprint, 300);
      
      if (!isNew) {
        results.push({ fingerprint: alert.fingerprint, status: 'duplicate' });
        continue;
      }

      // In production, map Datadog service to org/API
      const orgId = 'default-org'; // TODO: lookup from integration config
      
      const incident = await createIncident(
        orgId,
        'system-webhook',
        {
          title: alert.title,
          description: alert.description,
          severity: alert.severity,
        }
      );

      results.push({ 
        fingerprint: alert.fingerprint, 
        status: 'created', 
        incidentId: incident.id 
      });
    }

    res.json({ success: true, received: alerts.length, results });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/webhooks/prometheus
 * Prometheus Alertmanager webhook endpoint
 */
export async function receivePrometheusAlert(req: Request, res: Response, next: NextFunction) {
  try {
    const normalized = normalizeAlert('prometheus', req.body);
    const alerts = Array.isArray(normalized) ? normalized : [normalized];

    const results = [];
    
    for (const alert of alerts) {
      const isNew = await checkAndSetDedup(alert.fingerprint, 300);
      
      if (!isNew) {
        results.push({ fingerprint: alert.fingerprint, status: 'duplicate' });
        continue;
      }

      const orgId = 'default-org';
      
      const incident = await createIncident(
        orgId,
        'system-webhook',
        {
          title: alert.title,
          description: alert.description,
          severity: alert.severity,
        }
      );

      results.push({ 
        fingerprint: alert.fingerprint, 
        status: 'created', 
        incidentId: incident.id 
      });
    }

    res.json({ success: true, received: alerts.length, results });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/webhooks/grafana
 * Grafana webhook endpoint
 */
export async function receiveGrafanaAlert(req: Request, res: Response, next: NextFunction) {
  try {
    const normalized = normalizeAlert('grafana', req.body);
    const alerts = Array.isArray(normalized) ? normalized : [normalized];

    const results = [];
    
    for (const alert of alerts) {
      const isNew = await checkAndSetDedup(alert.fingerprint, 300);
      
      if (!isNew) {
        results.push({ fingerprint: alert.fingerprint, status: 'duplicate' });
        continue;
      }

      const orgId = 'default-org';
      
      const incident = await createIncident(
        orgId,
        'system-webhook',
        {
          title: alert.title,
          description: alert.description,
          severity: alert.severity,
        }
      );

      results.push({ 
        fingerprint: alert.fingerprint, 
        status: 'created', 
        incidentId: incident.id 
      });
    }

    res.json({ success: true, received: alerts.length, results });
  } catch (error) {
    next(error);
  }
}

/**
 * Webhook source management (placeholder - would use DB in production)
 */
const webhookSources = new Map<string, any>();

export async function listSources(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ success: true, data: Array.from(webhookSources.values()) });
  } catch (error) {
    next(error);
  }
}

export async function createSource(req: Request, res: Response, next: NextFunction) {
  try {
    const source = {
      id: req.body.id || crypto.randomUUID(),
      name: req.body.name,
      sourceType: req.body.sourceType,
      hmacSecret: req.body.hmacSecret,
      isActive: true,
      createdAt: new Date(),
    };
    webhookSources.set(source.id, source);
    res.status(201).json({ success: true, data: source });
  } catch (error) {
    next(error);
  }
}

export async function getSource(req: Request, res: Response, next: NextFunction) {
  try {
    const source = webhookSources.get(getParam(req, 'id'));
    if (!source) throw ApiError.notFound('Webhook source');
    res.json({ success: true, data: source });
  } catch (error) {
    next(error);
  }
}

export async function updateSource(req: Request, res: Response, next: NextFunction) {
  try {
    const source = webhookSources.get(getParam(req, 'id'));
    if (!source) throw ApiError.notFound('Webhook source');
    
    const updated = { ...source, ...req.body, updatedAt: new Date() };
    webhookSources.set(getParam(req, 'id'), updated);
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
}

export async function deleteSource(req: Request, res: Response, next: NextFunction) {
  try {
    if (!webhookSources.has(getParam(req, 'id'))) throw ApiError.notFound('Webhook source');
    webhookSources.delete(getParam(req, 'id'));
    res.json({ success: true, message: 'Webhook source deleted' });
  } catch (error) {
    next(error);
  }
}