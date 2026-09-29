// ============================================
// PulseOps CRM - Alert Normalizer Service
// ============================================
// Normalizes alerts from various sources into a standard format

import { IncidentSeverity } from '@prisma/client';
import { generateFingerprint } from './redis.dedup';

export interface NormalizedAlert {
  fingerprint: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  source: string;
  sourceType: 'datadog' | 'prometheus' | 'grafana' | 'custom' | 'api';
  rawPayload: any;
  metadata: {
    service?: string;
    environment?: string;
    tags?: Record<string, string>;
    metric?: string;
    threshold?: number;
    currentValue?: number;
    runbookUrl?: string;
    dashboardUrl?: string;
  };
}

/**
 * Map source-specific severity to PulseOps IncidentSeverity
 */
function mapSeverity(source: string, severity: any): IncidentSeverity {
  const normalized = String(severity).toLowerCase();
  
  // Datadog: critical, warning, info
  // Prometheus: critical, warning, info
  // Grafana: critical, high, medium, low
  // Generic: p1, p2, p3, p4, critical, high, medium, low, warning, info
  
  if (['critical', 'p1', 'p0', 'sev0', 'sev1'].includes(normalized)) return 'critical';
  if (['high', 'p2', 'sev2', 'error'].includes(normalized)) return 'high';
  if (['medium', 'warning', 'p3', 'sev3', 'warn'].includes(normalized)) return 'medium';
  if (['low', 'p4', 'sev4', 'info'].includes(normalized)) return 'low';
  
  return 'medium'; // default
}

/**
 * Normalize Datadog webhook payload
 * https://docs.datadoghq.com/integrations/webhooks/
 */
export function normalizeDatadog(payload: any): NormalizedAlert {
  const alert = payload.alert || payload;
  
  return {
    fingerprint: generateFingerprint({
      source: 'datadog',
      title: alert.title,
      service: alert.tags?.service,
      environment: alert.tags?.env,
      tags: alert.tags,
      metric: alert.query,
    }),
    title: alert.title || 'Datadog Alert',
    description: alert.message || alert.description || 'No description provided',
    severity: mapSeverity('datadog', alert.priority || alert.alert_type),
    source: 'datadog',
    sourceType: 'datadog',
    rawPayload: payload,
    metadata: {
      service: alert.tags?.service,
      environment: alert.tags?.env,
      tags: alert.tags,
      metric: alert.query,
      runbookUrl: alert.runbook_url,
      dashboardUrl: alert.dashboard_url,
    },
  };
}

/**
 * Normalize Prometheus Alertmanager payload
 * https://prometheus.io/docs/alerting/latest/configuration/#webhook_config
 */
export function normalizePrometheus(payload: any): NormalizedAlert[] {
  const alerts = payload.alerts || [];
  
  return alerts.map((alert: any) => ({
    fingerprint: generateFingerprint({
      source: 'prometheus',
      title: alert.labels?.alertname,
      service: alert.labels?.service,
      environment: alert.labels?.env,
      tags: alert.labels,
      metric: alert.annotations?.metric,
    }),
    title: alert.labels?.alertname || 'Prometheus Alert',
    description: alert.annotations?.description || alert.annotations?.summary || 'No description',
    severity: mapSeverity('prometheus', alert.labels?.severity),
    source: 'prometheus',
    sourceType: 'prometheus',
    rawPayload: payload,
    metadata: {
      service: alert.labels?.service,
      environment: alert.labels?.env,
      tags: alert.labels,
      metric: alert.annotations?.metric,
      threshold: alert.annotations?.threshold ? parseFloat(alert.annotations.threshold) : undefined,
      currentValue: alert.annotations?.value ? parseFloat(alert.annotations.value) : undefined,
      runbookUrl: alert.annotations?.runbook_url,
      dashboardUrl: alert.generatorURL,
    },
  }));
}

/**
 * Normalize Grafana webhook payload
 * https://grafana.com/docs/grafana/latest/alerting/contact-points/webhook/
 */
export function normalizeGrafana(payload: any): NormalizedAlert {
  const alert = payload.alerts?.[0] || payload;
  
  return {
    fingerprint: generateFingerprint({
      source: 'grafana',
      title: alert.labels?.alertname || alert.annotations?.title,
      service: alert.labels?.service,
      environment: alert.labels?.env,
      tags: alert.labels,
      metric: alert.annotations?.metric,
    }),
    title: alert.labels?.alertname || alert.annotations?.title || 'Grafana Alert',
    description: alert.annotations?.description || alert.annotations?.summary || 'No description',
    severity: mapSeverity('grafana', alert.labels?.severity),
    source: 'grafana',
    sourceType: 'grafana',
    rawPayload: payload,
    metadata: {
      service: alert.labels?.service,
      environment: alert.labels?.env,
      tags: alert.labels,
      metric: alert.annotations?.metric,
      threshold: alert.annotations?.threshold ? parseFloat(alert.annotations.threshold) : undefined,
      runbookUrl: alert.annotations?.runbook_url,
      dashboardUrl: alert.dashboardURL || alert.panelURL,
    },
  };
}

/**
 * Normalize generic/custom JSON payload
 */
export function normalizeCustom(payload: any): NormalizedAlert {
  // Expected fields: title, description, severity, service, environment, tags, metric
  return {
    fingerprint: generateFingerprint({
      source: 'custom',
      title: payload.title,
      service: payload.service,
      environment: payload.environment,
      tags: payload.tags,
      metric: payload.metric,
    }),
    title: payload.title || 'Custom Alert',
    description: payload.description || payload.message || 'No description provided',
    severity: mapSeverity('custom', payload.severity || payload.priority),
    source: payload.source || 'custom',
    sourceType: 'custom',
    rawPayload: payload,
    metadata: {
      service: payload.service,
      environment: payload.environment,
      tags: payload.tags,
      metric: payload.metric,
      threshold: payload.threshold,
      currentValue: payload.currentValue,
      runbookUrl: payload.runbookUrl,
      dashboardUrl: payload.dashboardUrl,
    },
  };
}

/**
 * Main normalization function - routes to source-specific normalizer
 */
export function normalizeAlert(sourceType: string, payload: any): NormalizedAlert | NormalizedAlert[] {
  switch (sourceType.toLowerCase()) {
    case 'datadog':
      return normalizeDatadog(payload);
    case 'prometheus':
      return normalizePrometheus(payload);
    case 'grafana':
      return normalizeGrafana(payload);
    case 'custom':
    case 'api':
    default:
      return normalizeCustom(payload);
  }
}