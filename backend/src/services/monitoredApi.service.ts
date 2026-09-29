// ============================================
// PulseOps CRM - Monitored API Service
// ============================================

import { ApiStatus, Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { ApiError } from '../middleware/errorHandler.middleware';

export async function listMonitoredApis(
  orgId: string,
  filters: { status?: ApiStatus; isActive?: boolean },
  pagination: { page: number; limit: number }
) {
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;
  const take = limit;

  const where: Prisma.MonitoredApiWhereInput = { orgId };
  if (filters.status) where.status = filters.status;
  if (filters.isActive !== undefined) where.isActive = filters.isActive;

  const [apis, total] = await Promise.all([
    prisma.monitoredApi.findMany({
      where,
      include: {
        _count: {
          select: {
            alertRules: true,
            incidents: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.monitoredApi.count({ where }),
  ]);

  return { apis, total };
}

export async function createMonitoredApi(
  orgId: string,
  userId: string,
  data: {
    name: string;
    endpointUrl: string;
    method?: string;
    headers?: Prisma.InputJsonValue;
    body?: Prisma.InputJsonValue;
    expectedStatusCodes?: number[];
    timeoutSeconds?: number;
    checkIntervalSeconds?: number;
    isActive?: boolean;
  }
) {
  const api = await prisma.monitoredApi.create({
    data: {
      orgId,
      name: data.name,
      endpointUrl: data.endpointUrl,
      method: data.method as any || 'GET',
      headers: data.headers || {},
      body: data.body || {},
      expectedStatusCodes: data.expectedStatusCodes || [200],
      timeoutSeconds: data.timeoutSeconds || 10,
      checkIntervalSeconds: data.checkIntervalSeconds || 60,
      isActive: data.isActive ?? true,
      status: 'operational',
    },
  });

  return api;
}

export async function getMonitoredApiById(orgId: string, apiId: string) {
  const api = await prisma.monitoredApi.findFirst({
    where: { id: apiId, orgId },
    include: {
      alertRules: {
        where: { isActive: true },
        select: { id: true, triggerType: true, condition: true }
      },
      _count: {
        select: {
          checks: true,
          incidents: true,
        },
      },
    },
  });
  return api;
}

export async function updateMonitoredApi(
  orgId: string,
  apiId: string,
  data: Partial<{
    name: string;
    endpointUrl: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    headers: Prisma.InputJsonValue;
    body: Prisma.InputJsonValue;
    expectedStatusCodes: number[];
    timeoutSeconds: number;
    checkIntervalSeconds: number;
    isActive: boolean;
  }>,
  actor: { id: string; orgId: string }
) {
  const api = await prisma.monitoredApi.findFirst({ where: { id: apiId, orgId } });
  if (!api) throw ApiError.notFound('Monitored API');

  const updatedApi = await prisma.monitoredApi.update({
    where: { id: apiId },
    data: {
      ...data,
      updatedAt: new Date(),
    },
  });

  return updatedApi;
}

export async function deleteMonitoredApi(
  orgId: string,
  apiId: string,
  actor: { id: string; orgId: string }
) {
  const api = await prisma.monitoredApi.findFirst({ where: { id: apiId, orgId } });
  if (!api) throw ApiError.notFound('Monitored API');

  await prisma.monitoredApi.delete({ where: { id: apiId } });
}

export async function getApiChecks(
  orgId: string,
  apiId: string,
  pagination: { page: number; limit: number }
) {
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;
  const take = limit;

  const where: Prisma.ApiCheckWhereInput = { api: { id: apiId, orgId } };

  const [checks, total] = await Promise.all([
    prisma.apiCheck.findMany({
      where,
      orderBy: { checkedAt: 'desc' },
      skip,
      take,
    }),
    prisma.apiCheck.count({ where }),
  ]);

  return { checks, total };
}

export async function getApiStatus(orgId: string, apiId: string) {
  const api = await prisma.monitoredApi.findFirst({
    where: { id: apiId, orgId },
    select: {
      id: true,
      name: true,
      status: true,
      endpointUrl: true,
      isActive: true,
      checkIntervalSeconds: true,
      _count: {
        select: {
          checks: true,
          incidents: true,
        },
      },
    },
  });

  if (!api) throw ApiError.notFound('Monitored API');

  // Get latest check
  const latestCheck = await prisma.apiCheck.findFirst({
    where: { apiId },
    orderBy: { checkedAt: 'desc' },
    select: {
      statusCode: true,
      responseTimeMs: true,
      isSuccess: true,
      checkedAt: true,
      errorMessage: true,
    },
  });

  return {
    ...api,
    latestCheck,
  };
}