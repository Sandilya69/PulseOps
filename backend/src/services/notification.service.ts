// ============================================
// PulseOps CRM - Notification Service
// ============================================

import prisma from '../lib/prisma';
import { ApiError } from '../middleware/errorHandler.middleware';

interface NotificationFilters {
  unreadOnly?: boolean;
  page?: number;
  limit?: number;
}

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
      pushEnabled: data.pushEnabled,
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

/**
 * List user notifications with pagination
 */
export async function listNotifications(userId: string, filters: NotificationFilters) {
  const { unreadOnly, page = 1, limit = 30 } = filters;
  const skip = (page - 1) * limit;

  const where: any = { userId };
  if (unreadOnly) where.read = false;

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where }),
  ]);

  return {
    data: notifications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
}

/**
 * Mark a notification as read
 */
export async function markAsRead(userId: string, notificationId: string) {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });

  if (!notification) {
    throw ApiError.notFound('Notification');
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}
