// ============================================
// PulseOps CRM - Alert Rule Service
// ============================================

import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { ApiError } from '../middleware/errorHandler.middleware';

export async function listAlertRules(
  orgId: string,
  apiId: string,
  filters: { isActive?: boolean; triggerType?: string },
  pagination: { page: number; limit: number }
) {
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;
  const take = limit;

  const where: Prisma.AlertRuleWhereInput = { api: { id: apiId, orgId } };
  if (filters.isActive !== undefined) where.isActive = filters.isActive;
  if (filters.triggerType) where.triggerType = filters.triggerType;

  const [rules, total] = await Promise.all([
    prisma.alertRule.findMany({
      where,
      include: {
        api: { select: { name: true, endpointUrl: true } },
        _count: { select: { alerts: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.alertRule.count({ where }),
  ]);

  return { rules, total };
}

export async function createAlertRule(
  orgId: string,
  apiId: string,
  userId: string,
  data: {
    triggerType: string;
    condition: Prisma.InputJsonValue;
    isActive?: boolean;
  }
) {
  // Verify API exists and belongs to org
  const api = await prisma.monitoredApi.findFirst({
    where: { id: apiId, orgId },
  });
  if (!api) throw ApiError.notFound('Monitored API');

  const rule = await prisma.alertRule.create({
    data: {
      apiId,
      triggerType: data.triggerType,
      condition: data.condition,
      isActive: data.isActive ?? true,
    },
  });

  return rule;
}

export async function updateAlertRule(
  orgId: string,
  ruleId: string,
  data: Partial<{
    triggerType: string;
    condition: Prisma.InputJsonValue;
    isActive: boolean;
  }>,
  actor: { id: string; orgId: string }
) {
  const rule = await prisma.alertRule.findFirst({
    where: { id: ruleId, api: { orgId } },
  });
  if (!rule) throw ApiError.notFound('Alert Rule');

  const updatedRule = await prisma.alertRule.update({
    where: { id: ruleId },
    data: {
      ...data,
    },
  });

  return updatedRule;
}

export async function deleteAlertRule(
  orgId: string,
  ruleId: string,
  actor: { id: string; orgId: string }
) {
  const rule = await prisma.alertRule.findFirst({
    where: { id: ruleId, api: { orgId } },
  });
  if (!rule) throw ApiError.notFound('Alert Rule');

  await prisma.alertRule.delete({ where: { id: ruleId } });
}