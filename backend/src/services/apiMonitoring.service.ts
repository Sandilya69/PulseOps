// ============================================
// PulseOps CRM - API Monitoring Service
// ============================================

import { ApiMethod, ApiStatus } from '@prisma/client';
import prisma from '../lib/prisma';
import { ApiError } from '../middleware/errorHandler.middleware';
import { activityLogService } from './activityLog.service';
import axios from 'axios';
import { createIncident } from './incident.service';

/**
 * Register a new API to be monitored
 */
export async function createMonitoredApi(
  orgId: string,
  userId: string,
  data: {
    name: string;
    endpointUrl: string;
    method: ApiMethod;
    headers?: any;
    body?: any;
    expectedStatusCodes?: number[];
    checkIntervalSeconds?: number;
  }
) {
  const api = await prisma.monitoredApi.create({
    data: {
      orgId,
      name: data.name,
      endpointUrl: data.endpointUrl,
      method: data.method,
      headers: data.headers || {},
      body: data.body || {},
      expectedStatusCodes: data.expectedStatusCodes || [200, 201, 204],
      checkIntervalSeconds: data.checkIntervalSeconds || 60
    }
  });

  await activityLogService.log({
    orgId,
    userId,
    action: 'api.created',
    resourceType: 'monitored_api',
    resourceId: api.id,
    resourceName: api.name
  });

  return api;
}

/**
 * List monitored APIs
 */
export async function listMonitoredApis(orgId: string) {
  return prisma.monitoredApi.findMany({
    where: { orgId },
    orderBy: { createdAt: 'desc' }
  });
}

/**
 * Ping an API manually (used by the cron system OR manual check)
 */
export async function pingApi(orgId: string, apiId: string) {
  const api = await prisma.monitoredApi.findFirst({ where: { id: apiId, orgId } });
  if (!api || !api.isActive) throw ApiError.notFound('Active API not found');

  const startTime = Date.now();
  let isSuccess = false;
  let responseStatus = 0;
  let responseBody = '';
  let errorMessage = '';

  try {
    const res = await axios({
      method: api.method,
      url: api.endpointUrl,
      headers: api.headers as any,
      data: api.body,
      timeout: api.timeoutSeconds * 1000
    });

    responseStatus = res.status;
    responseBody = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
    isSuccess = api.expectedStatusCodes.includes(res.status);

  } catch (error: any) {
    if (error.response) {
      responseStatus = error.response.status;
      responseBody = typeof error.response.data === 'string' ? error.response.data : JSON.stringify(error.response.data);
      isSuccess = api.expectedStatusCodes.includes(error.response.status);
    } else {
      errorMessage = error.message;
      isSuccess = false;
    }
  }

  const responseTimeMs = Date.now() - startTime;

  // Log the Check
  await prisma.apiCheck.create({
    data: {
      apiId,
      statusCode: responseStatus,
      responseTimeMs,
      responseBody: responseBody.substring(0, 1000), // Trim payload
      errorMessage,
      isSuccess
    }
  });

  // Calculate new API Status
  const newStatus: ApiStatus = isSuccess ? 'operational' : 'down';
  
  // If status changed from operational to down, trigger INCIDENT!
  if (api.status === 'operational' && newStatus === 'down') {
    // We create the incident attributing to system (userId: robot representation, or simply the org owner)
    const orgOwner = await prisma.organization.findUnique({ where: { id: orgId }, select: { ownerId: true } });
    if (orgOwner) {
       await createIncident(
         orgId, 
         orgOwner.ownerId, 
         {
           title: `API Down: ${api.name}`,
           description: `Endpoint ${api.method} ${api.endpointUrl} failed. Returned status: ${responseStatus || 'TIMEOUT'}.\nError: ${errorMessage}`,
           severity: 'critical',
           apiId: api.id
         }
       );
    }
  }

  // Update Status
  if (api.status !== newStatus) {
    await prisma.monitoredApi.update({
      where: { id: apiId },
      data: { status: newStatus }
    });
  }

  return { isSuccess, responseTimeMs, responseStatus };
}
