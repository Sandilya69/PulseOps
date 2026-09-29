// ============================================
// PulseOps CRM - Incident Service
// ============================================

import { IncidentSeverity, IncidentStatus, Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { ApiError } from '../middleware/errorHandler.middleware';
import { activityLogService } from './activityLog.service';
import { 
  dispatchDiscordAlert, 
  dispatchEmailAlert, 
  dispatchWhatsAppAlert, 
  dispatchVoiceCallAlert 
} from './integration.service';


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

  // Dispatch individual selectable user alerts (Email, WhatsApp, voice call)
  await notifyTeamMembers(orgId, incident.title, incident.description, incident.severity);

  return incident;
}

export async function listIncidents(
  orgId: string,
  filters: { status?: IncidentStatus; severity?: IncidentSeverity; apiId?: string },
  pagination: { page: number; limit: number } = { page: 1, limit: 20 }
) {
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;
  const take = limit;

  const where: Prisma.IncidentWhereInput = { orgId };
  if (filters.status) where.status = filters.status;
  if (filters.severity) where.severity = filters.severity;
  if (filters.apiId) where.apiId = filters.apiId;

  const [incidents, total] = await Promise.all([
    prisma.incident.findMany({
      where,
      include: {
        api: { select: { name: true } },
        resolver: { select: { name: true } },
        acknowledger: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.incident.count({ where }),
  ]);

  return { incidents, total };
}

export async function countIncidents(
  orgId: string,
  filters: { status?: IncidentStatus; severity?: IncidentSeverity; apiId?: string }
): Promise<number> {
  const where: Prisma.IncidentWhereInput = { orgId };
  if (filters.status) where.status = filters.status;
  if (filters.severity) where.severity = filters.severity;
  if (filters.apiId) where.apiId = filters.apiId;
  return prisma.incident.count({ where });
}

export async function getIncidentById(orgId: string, incidentId: string) {
  const incident = await prisma.incident.findFirst({
    where: { id: incidentId, orgId },
    include: {
      api: { select: { name: true, endpointUrl: true, method: true } },
      resolver: { select: { name: true, email: true } },
      acknowledger: { select: { name: true, email: true } },
      timeline: {
        include: {
          actor: { select: { name: true, email: true } }
        },
        orderBy: { createdAt: 'asc' }
      }
    },
  });
  return incident;
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

  // Dispatch individual selectable user alerts (Email, WhatsApp, voice call)
  await notifyTeamMembers(
    orgId, 
    `Incident Update: ${incident.title}`, 
    `New Status: ${status}\n${notes ? `Notes: ${notes}` : 'No notes provided.'}`, 
    incident.severity
  );

  return updatedIncident;
}

/**
 * Notify all active team members in the organization based on their preferences
 */
async function notifyTeamMembers(orgId: string, title: string, description: string, severity: IncidentSeverity) {
  try {
    const users = await prisma.user.findMany({
      where: { orgId, isActive: true },
      include: { notificationPreference: true }
    });

    for (const user of users) {
      const prefs = user.notificationPreference;
      
      const emailEnabled = prefs ? prefs.emailEnabled : true;
      const smsEnabled = prefs ? prefs.smsEnabled : false;
      const severityFilter = prefs ? (prefs.severityFilter as IncidentSeverity[]) : ['critical', 'high', 'medium', 'low'] as IncidentSeverity[];

      // Check severity filter
      if (!severityFilter.includes(severity)) {
        continue;
      }

      // 1. Dispatch Email Alert
      if (emailEnabled && user.email) {
        const subject = `[PulseOps ALERT] ${title}`;
        const html = `
          <div style="font-family: sans-serif; padding: 20px; background-color: #0c0f1d; color: #f1f5f9; border-radius: 8px;">
            <h2 style="color: #06b6d4; margin-top: 0;">PulseOps Incident Notification</h2>
            <p><strong>Incident Title:</strong> ${title}</p>
            <p><strong>Severity:</strong> <span style="text-transform: uppercase; color: ${severity === 'critical' ? '#ef4444' : severity === 'high' ? '#f59e0b' : '#3b82f6'}">${severity}</span></p>
            <p><strong>Description:</strong> ${description}</p>
            <hr style="border-color: #1e293b; margin: 20px 0;" />
            <p style="font-size: 13px; color: #94a3b8;">Log in to your PulseOps workspace dashboard to acknowledge or resolve this incident.</p>
          </div>
        `;
        await dispatchEmailAlert(user.email, subject, html);
      }

      // 2. Dispatch WhatsApp & Voice Call Alerts (for critical)
      if (smsEnabled && user.phoneNumber) {
        const message = `🚨 PulseOps ALERT: ${title}\nSeverity: ${severity.toUpperCase()}\nDescription: ${description}`;
        await dispatchWhatsAppAlert(user.phoneNumber, message);

        // Wake up call for critical alerts!
        if (severity === 'critical') {
          const speakText = `Alert. PulseOps incident triggered: ${title}. Please check your system immediately.`;
          await dispatchVoiceCallAlert(user.phoneNumber, speakText);
        }
      }
    }
  } catch (err) {
    console.error('❌ Failed to dispatch team notifications:', err);
  }
}

/**
 * Escalate an incident manually to the next level
 */
export async function escalateIncident(
  orgId: string,
  incidentId: string,
  userId: string,
  notes?: string
) {
  const incident = await prisma.incident.findFirst({ where: { id: incidentId, orgId } });
  if (!incident) throw ApiError.notFound('Incident');

  if (incident.status === 'resolved' || incident.status === 'closed') {
    throw ApiError.badRequest('Cannot escalate a resolved or closed incident');
  }

  // Add escalation note to timeline
  await prisma.incidentTimelineEvent.create({
    data: {
      incidentId,
      actorId: userId,
      eventType: 'escalation',
      content: notes || 'Incident manually escalated',
    }
  });

  // Notify via Discord
  const integrations = await prisma.integration.findMany({
    where: { orgId, type: 'discord', isActive: true }
  });

  for (const integration of integrations) {
    await dispatchDiscordAlert(
      integration.id, 
      `⬆️ Incident Escalated: ${incident.title}`, 
      `**Escalated by:** ${incident.acknowledgedBy}\n${notes ? `**Notes:** ${notes}` : ''}`,
      0xff0000
    );
  }

  // Dispatch individual alerts (Email, WhatsApp, voice call)
  await notifyTeamMembers(
    orgId, 
    `ESCALATED: ${incident.title}`, 
    `Incident manually escalated\n${notes ? `Notes: ${notes}` : 'No notes provided.'}`, 
    incident.severity
  );

  await activityLogService.log({
    orgId,
    userId,
    action: 'incident.escalated',
    resourceType: 'incident',
    resourceId: incidentId,
    resourceName: incident.title,
  });

  return getIncidentById(orgId, incidentId);
}

/**
 * Add a note/timeline event to an incident
 */
export async function addTimelineEvent(
  orgId: string,
  incidentId: string,
  userId: string,
  content: string,
  isPublic: boolean = false
) {
  const incident = await prisma.incident.findFirst({ where: { id: incidentId, orgId } });
  if (!incident) throw ApiError.notFound('Incident');

  const event = await prisma.incidentTimelineEvent.create({
    data: {
      incidentId,
      actorId: userId,
      eventType: 'note_added',
      content,
      isPublic,
    },
    include: {
      actor: { select: { name: true, email: true } }
    }
  });

  await activityLogService.log({
    orgId,
    userId,
    action: 'incident.note_add',
    resourceType: 'incident',
    resourceId: incidentId,
    resourceName: incident.title,
    metadata: { isPublic },
  });

  return event;
}

/**
 * Get full incident timeline
 */
export async function getIncidentTimeline(orgId: string, incidentId: string) {
  const incident = await prisma.incident.findFirst({ where: { id: incidentId, orgId } });
  if (!incident) throw ApiError.notFound('Incident');

  const timeline = await prisma.incidentTimelineEvent.findMany({
    where: { incidentId },
    include: {
      actor: { select: { name: true, email: true } }
    },
    orderBy: { createdAt: 'asc' }
  });

  return timeline;
}

