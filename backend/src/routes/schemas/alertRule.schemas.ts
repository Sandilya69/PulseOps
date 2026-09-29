// ============================================
// PulseOps CRM - Alert Rule Validation Schemas
// ============================================

import { z } from 'zod';

export const createAlertRuleSchema = z.object({
  triggerType: z.enum(['downtime', 'latency', 'error_rate', 'status_code']),
  condition: z.object({
    // For downtime: { threshold: number, durationMinutes: number }
    // For latency: { thresholdMs: number, durationMinutes: number, percentile?: number }
    // For error_rate: { thresholdPercent: number, durationMinutes: number }
    // For status_code: { statusCodes: number[], durationMinutes: number }
  }),
  isActive: z.boolean().default(true),
});

export const updateAlertRuleSchema = createAlertRuleSchema.partial();

export const alertRuleFiltersSchema = z.object({
  isActive: z.coerce.boolean().optional(),
  triggerType: z.enum(['downtime', 'latency', 'error_rate', 'status_code']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateAlertRuleInput = z.infer<typeof createAlertRuleSchema>;
export type UpdateAlertRuleInput = z.infer<typeof updateAlertRuleSchema>;
export type AlertRuleFiltersInput = z.infer<typeof alertRuleFiltersSchema>;