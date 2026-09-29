// ============================================
// PulseOps CRM - Webhook HMAC Middleware
// ============================================

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { ApiError } from './errorHandler.middleware';
import { getParam } from '../utils/params';

interface WebhookSource {
  id: string;
  name: string;
  hmacSecret: string;
  sourceType: 'datadog' | 'prometheus' | 'grafana' | 'custom';
  isActive: boolean;
}

declare global {
  namespace Express {
    interface Request {
      webhookSource?: WebhookSource;
      normalizedAlert?: any;
    }
  }
}

/**
 * Validate webhook HMAC signature
 * Supports multiple signature formats per source type
 */
export function validateWebhookSignature() {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const sourceId = getParam(req, 'sourceId');
      
      // In production, fetch from database
      // For now, use env var or default
      const webhookSecret = process.env.WEBHOOK_HMAC_SECRET || 'dev-webhook-secret';
      
      const signature = req.headers['x-signature'] as string
        || req.headers['x-datadog-signature'] as string
        || req.headers['x-prometheus-signature'] as string
        || req.headers['x-grafana-signature'] as string;

      if (!signature) {
        throw ApiError.unauthorized('Missing webhook signature');
      }

      const payload = JSON.stringify(req.body);
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex');

      const providedSignature = signature.replace('sha256=', '');
      
      if (!crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(providedSignature))) {
        throw ApiError.unauthorized('Invalid webhook signature');
      }

      // Attach source info for downstream use
      req.webhookSource = {
        id: sourceId,
        name: req.headers['x-source-name'] as string || 'unknown',
        hmacSecret: webhookSecret,
        sourceType: (req.headers['x-source-type'] as any) || 'custom',
        isActive: true,
      };

      next();
    } catch (error) {
      if (error instanceof ApiError) {
        next(error);
      } else {
        next(ApiError.unauthorized('Webhook validation failed'));
      }
    }
  };
}

/**
 * Datadog-specific signature validation
 * Datadog uses: X-Datadog-Signature: sha256=<hash>
 */
export function validateDatadogSignature() {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const secret = process.env.DATADOG_WEBHOOK_SECRET || process.env.WEBHOOK_HMAC_SECRET;
      const signature = req.headers['x-datadog-signature'] as string;

      if (!signature || !secret) {
        throw ApiError.unauthorized('Missing Datadog signature or secret');
      }

      const payload = JSON.stringify(req.body);
      const expectedSignature = `sha256=${crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex')}`;

      if (!crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature))) {
        throw ApiError.unauthorized('Invalid Datadog signature');
      }

      req.webhookSource = {
        id: 'datadog',
        name: 'Datadog',
        hmacSecret: secret,
        sourceType: 'datadog',
        isActive: true,
      };

      next();
    } catch (error) {
      next(error instanceof ApiError ? error : ApiError.unauthorized('Datadog validation failed'));
    }
  };
}

/**
 * Prometheus Alertmanager signature validation
 * Uses: X-Prometheus-Signature: sha256=<hash>
 */
export function validatePrometheusSignature() {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const secret = process.env.PROMETHEUS_WEBHOOK_SECRET || process.env.WEBHOOK_HMAC_SECRET;
      const signature = req.headers['x-prometheus-signature'] as string;

      if (!signature || !secret) {
        throw ApiError.unauthorized('Missing Prometheus signature or secret');
      }

      const payload = JSON.stringify(req.body);
      const expectedSignature = `sha256=${crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex')}`;

      if (!crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature))) {
        throw ApiError.unauthorized('Invalid Prometheus signature');
      }

      req.webhookSource = {
        id: 'prometheus',
        name: 'Prometheus Alertmanager',
        hmacSecret: secret,
        sourceType: 'prometheus',
        isActive: true,
      };

      next();
    } catch (error) {
      next(error instanceof ApiError ? error : ApiError.unauthorized('Prometheus validation failed'));
    }
  };
}

/**
 * Grafana-specific signature validation
 */
export function validateGrafanaSignature() {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const secret = process.env.GRAFANA_WEBHOOK_SECRET || process.env.WEBHOOK_HMAC_SECRET;
      const signature = req.headers['x-grafana-signature'] as string;

      if (!signature || !secret) {
        throw ApiError.unauthorized('Missing Grafana signature or secret');
      }

      const payload = JSON.stringify(req.body);
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      if (!crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature))) {
        throw ApiError.unauthorized('Invalid Grafana signature');
      }

      req.webhookSource = {
        id: 'grafana',
        name: 'Grafana',
        hmacSecret: secret,
        sourceType: 'grafana',
        isActive: true,
      };

      next();
    } catch (error) {
      next(error instanceof ApiError ? error : ApiError.unauthorized('Grafana validation failed'));
    }
  };
}