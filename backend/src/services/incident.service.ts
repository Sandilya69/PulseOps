// ============================================
// PulseOps CRM - Incident Service
// ============================================

import { IncidentSeverity, IncidentStatus } from '@prisma/client';
import prisma from '../lib/prisma';
import { ApiError } from '../middleware/errorHandler.middleware';
import { activityLogService } from './activityLog.service';
import { dispatchDiscordAlert } from './integration.service';

export async function createIncident(
  orgId: string,
  userId: string,
  data: { title: string; description: string; severity: IncidentSeverity; apiId?: string }
) {
  const incident = await prisma.incident.create({
    data: {
      orgId,
      title: data.title,
      description: data.description,
      severity: data.severity,
      apiId: data.apiId,
      status: 'triggered'
    }
  });

  // Track in timeline
  await prisma.incidentTimelineEvent.create({
    data: {
      incidentId: incident.id,
      actorId: userId,
      eventType: 'status_change',
      content: `Incident triggered with severity: ${data.severity}`
    }
  });

  await activityLogService.log({
    orgId,
    userId,
    action: 'incident.created',
    resourceType: 'incident',
    resourceId: incident.id,
    resourceName: incident.title
  });

  // Automatically dispatch Discord webhook if an active discord integration exists
  const integrations = await prisma.integration.findMany({
    where: { orgId, type: 'discord', isActive: true }
  });

  for (const integration of integrations) {
    const color = data.severity === 'critical' ? 0xff0000 : (data.severity === 'high' ? 0xffaa00 : 0xffff00);
    await dispatchDiscordAlert(
      integration.id, 
      `🚨 New Incident: ${incident.title}`, 
      `**Severity:** ${data.severity}\n**Description:** ${incident.description}`,
      color
    );
  }

  return incident;
}

export async function listIncidents(orgId: string, filters: { status?: IncidentStatus; severity?: IncidentSeverity }) {
  return prisma.incident.findMany({
    where: { orgId, ...filters },
    include: {
      api: { select: { name: true } },
      resolver: { select: { name: true } },
      acknowledger: { select: { name: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function updateIncidentStatus(orgId: string, incidentId: string, userId: string, status: IncidentStatus, notes?: string) {
  const incident = await prisma.incident.findFirst({ where: { id: incidentId, orgId } });
  if (!incident) throw ApiError.notFound('Incident');

  const updateData: any = { status, updatedAt: new Date() };

  if (status === 'acknowledged' && !incident.acknowledgedAt) {
    updateData.acknowledgedAt = new Date();
    updateData.acknowledgedBy = userId;
  }
  
  if (status === 'resolved' && !incident.resolvedAt) {
    updateData.resolvedAt = new Date();
    updateData.resolvedBy = userId;
  }

  const updatedIncident = await prisma.incident.update({
    where: { id: incidentId },
    data: updateData
  });

  await prisma.incidentTimelineEvent.create({
    data: {
      incidentId,
      actorId: userId,
      eventType: 'status_change',
      content: notes || `Status changed from ${incident.status} to ${status}`
    }
  });

  // Notify via Discord
  const integrations = await prisma.integration.findMany({
    where: { orgId, type: 'discord', isActive: true }
  });

  for (const integration of integrations) {
    let color = 0xffff00;
    if (status === 'resolved') color = 0x00ff00;
    else if (status === 'acknowledged') color = 0x00aaff;

    await dispatchDiscordAlert(
      integration.id, 
      `ℹ️ Incident Update: ${incident.title}`, 
      `**New Status:** ${status}\n${notes ? `**Notes:** ${notes}` : ''}`,
      color
    );
  }

  return updatedIncident;
}
