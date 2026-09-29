// ============================================
// PulseOps CRM - Webhook Routes
// ============================================

import { Router } from 'express';
import { validateWebhookSignature, validateDatadogSignature, validatePrometheusSignature, validateGrafanaSignature } from '../middleware/hmac.middleware';
import * as webhookController from '../controllers/webhook.controller';

const router = Router();

// Generic webhook with HMAC validation
router.post(
  '/webhooks/alerts/:sourceId',
  validateWebhookSignature(),
  webhookController.receiveAlert
);

// Source-specific webhooks (optimized validation)
router.post(
  '/webhooks/datadog',
  validateDatadogSignature(),
  webhookController.receiveDatadogAlert
);

router.post(
  '/webhooks/prometheus',
  validatePrometheusSignature(),
  webhookController.receivePrometheusAlert
);

router.post(
  '/webhooks/grafana',
  validateGrafanaSignature(),
  webhookController.receiveGrafanaAlert
);

// Webhook source management (for configuring HMAC secrets)
router.get('/webhooks/sources', webhookController.listSources);
router.post('/webhooks/sources', webhookController.createSource);
router.get('/webhooks/sources/:id', webhookController.getSource);
router.patch('/webhooks/sources/:id', webhookController.updateSource);
router.delete('/webhooks/sources/:id', webhookController.deleteSource);

export default router;