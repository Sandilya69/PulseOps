// ============================================
// PulseOps CRM - Notification Service
// ============================================

import prisma from '../lib/prisma';
import { ApiError } from '../middleware/errorHandler.middleware';

/**
 * Get current user's notification preferences
 */
export async function getPreferences(userId: string) {
  let prefs = await prisma.notificationPreference.findUnique({
    where: { userId }
  });

  if (!prefs) {
    // Should be created during onboarding/signup, but auto-create if missing to be safe
    prefs = await prisma.notificationPreference.create({
      data: { userId }
    });
  }

  return prefs;
}

/**
 * Update current user's notification preferences
 */
export async function updatePreferences(userId: string, data: any) {
  const prefs = await prisma.notificationPreference.update({
    where: { userId },
    data: {
      emailEnabled: data.emailEnabled,
      smsEnabled: data.smsEnabled,
      severityFilter: data.severityFilter,
      quietHoursEnabled: data.quietHoursEnabled,
      quietHoursStart: data.quietHoursStart,
      quietHoursEnd: data.quietHoursEnd,
      quietHoursTimezone: data.quietHoursTimezone,
      dailyDigestEnabled: data.dailyDigestEnabled,
      weeklyDigestEnabled: data.weeklyDigestEnabled,
      incidentUpdates: data.incidentUpdates,
      mentionNotify: data.mentionNotify,
      teamChangesNotify: data.teamChangesNotify,
    }
  });

  return prefs;
}
