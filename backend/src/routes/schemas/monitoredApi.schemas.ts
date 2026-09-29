// ============================================
// PulseOps CRM - Monitored API Validation Schemas
// ============================================

import { z } from 'zod';
import { ApiMethod, ApiStatus } from '@prisma/client';

export const createMonitoredApiSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(255, 'Name must be under 255 characters')
    .trim(),
  endpointUrl: z.string().url('Invalid URL format'),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as [ApiMethod, ...ApiMethod[]]).default('GET'),
  headers: z.record(z.string()).default({}),
  body: z.record(z.unknown()).default({}),
  expectedStatusCodes: z.array(z.number().int()).default([200]),
  timeoutSeconds: z.number().int().positive().max(60).default(10),
  checkIntervalSeconds: z.number().int().positive().max(3600).default(60),
  isActive: z.boolean().default(true),
});

export const updateMonitoredApiSchema = createMonitoredApiSchema.partial();

export const monitoredApiFiltersSchema = z.object({
  status: z.enum(['operational', 'degraded', 'down', 'maintenance'] as [ApiStatus, ...ApiStatus[]]).optional(),
  isActive: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateMonitoredApiInput = z.infer<typeof createMonitoredApiSchema>;
export type UpdateMonitoredApiInput = z.infer<typeof updateMonitoredApiSchema>;
export type MonitoredApiFiltersInput = z.infer<typeof monitoredApiFiltersSchema>;