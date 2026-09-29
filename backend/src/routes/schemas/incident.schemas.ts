// ============================================
// PulseOps CRM - Incident Validation Schemas
// ============================================

import { z } from 'zod';
import { IncidentSeverity, IncidentStatus } from '@prisma/client';

export const createIncidentSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(255, 'Title must be under 255 characters')
    .trim(),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description must be under 5000 characters')
    .trim(),
  severity: z.enum(['critical', 'high', 'medium', 'low'] as [IncidentSeverity, ...IncidentSeverity[]]),
  apiId: z.string().uuid('Invalid API ID').optional(),
});

export const updateIncidentStatusSchema = z.object({
  status: z.enum(['triggered', 'acknowledged', 'investigating', 'resolved', 'closed'] as [IncidentStatus, ...IncidentStatus[]]),
  notes: z.string().max(2000).optional(),
});

export const addIncidentNoteSchema = z.object({
  content: z
    .string()
    .min(1, 'Note content is required')
    .max(5000, 'Note must be under 5000 characters')
    .trim(),
  isPublic: z.boolean().default(false),
});

export const incidentFiltersSchema = z.object({
  status: z.enum(['triggered', 'acknowledged', 'investigating', 'resolved', 'closed']).optional(),
  severity: z.enum(['critical', 'high', 'medium', 'low']).optional(),
  apiId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateIncidentInput = z.infer<typeof createIncidentSchema>;
export type UpdateIncidentStatusInput = z.infer<typeof updateIncidentStatusSchema>;
export type AddIncidentNoteInput = z.infer<typeof addIncidentNoteSchema>;
export type IncidentFiltersInput = z.infer<typeof incidentFiltersSchema>;