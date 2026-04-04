// ============================================
// PulseOps CRM - Integration Service
// ============================================

import { IntegrationType } from '@prisma/client';
import prisma from '../lib/prisma';
import { ApiError } from '../middleware/errorHandler.middleware';
import { activityLogService } from './activityLog.service';
import axios from 'axios';

/**
 * Register a new Integration (e.g., Discord Webhook)
 */
export async function createIntegration(
  orgId: string,
  userId: string,
  data: { name: string; type: IntegrationType; config: any }
) {
  // If Discord, ensure a webhook URL is provided
  if (data.type === 'discord' && !data.config.webhookUrl) {
    throw ApiError.badRequest('Discord integration requires a webhookUrl in config.');
  }

  const integration = await prisma.integration.create({
    data: {
      orgId,
      name: data.name,
      type: data.type,
      config: data.config
    }
  });

  await activityLogService.log({
    orgId,
    userId,
    action: 'integration.created',
    resourceType: 'integration',
    resourceId: integration.id,
    resourceName: integration.name,
    metadata: { type: integration.type }
  });

  return integration;
}

/**
 * List all integrations for an organization
 */
export async function listIntegrations(orgId: string) {
  return prisma.integration.findMany({
    where: { orgId },
    orderBy: { createdAt: 'desc' }
  });
}

/**
 * Toggle Integration active status
 */
export async function toggleIntegration(orgId: string, integrationId: string, userId: string, isActive: boolean) {
  const integration = await prisma.integration.update({
    where: { id: integrationId, orgId },
    data: { isActive, updatedAt: new Date() }
  });
  
  return integration;
}

/**
 * Delete an Integration
 */
export async function deleteIntegration(orgId: string, integrationId: string, userId: string) {
  const integration = await prisma.integration.findFirst({ where: { id: integrationId, orgId } });
  if (!integration) throw ApiError.notFound('Integration');

  await prisma.integration.delete({ where: { id: integrationId } });

  await activityLogService.log({
    orgId,
    userId,
    action: 'integration.deleted',
    resourceType: 'integration',
    resourceId: integrationId,
    resourceName: integration.name
  });
}

/**
 * CORE LOGIC: Send a payload to a Discord Webhook
 */
export async function dispatchDiscordAlert(integrationId: string, title: string, description: string, color: number = 0xff0000) {
  const integration = await prisma.integration.findUnique({ where: { id: integrationId } });
  
  if (!integration || !integration.isActive || integration.type !== 'discord') {
    return false;
  }

  const webhookUrl = (integration.config as any).webhookUrl;
  if (!webhookUrl) return false;

  const payload = {
    embeds: [
      {
        title: title,
        description: description,
        color: color,
        timestamp: new Date().toISOString()
      }
    ]
  };

  try {
    const response = await axios.post(webhookUrl, payload);
    
    // Log success
    await prisma.integrationLog.create({
      data: {
        integrationId,
        status: 'success',
        responseStatus: response.status
      }
    });
    
    return true;

  } catch (error: any) {
    // Log failure
    await prisma.integrationLog.create({
      data: {
        integrationId,
        status: 'failed',
        errorMessage: error.message
      }
    });

    // Update failure count on integration
    await prisma.integration.update({
      where: { id: integrationId },
      data: { failureCount: { increment: 1 }, lastFailureAt: new Date() }
    });

    return false;
  }
}
