// ============================================
// PulseOps CRM - User Service
// ============================================

import { UserRole } from '@prisma/client';
import prisma from '../lib/prisma';
import { ApiError } from '../middleware/errorHandler.middleware';
import { canChangeRole } from '../lib/permissions';
import { activityLogService } from './activityLog.service';

interface ListUsersParams {
  page: number;
  limit: number;
  role?: string;
  status?: string;
  search?: string;
}

/**
 * List all users in an organization with filters and pagination
 */
export async function listUsers(orgId: string, params: ListUsersParams) {
  const { page, limit, role, status, search } = params;
  const skip = (page - 1) * limit;

  const where: any = { orgId };

  if (role) where.role = role;
  if (status === 'active') where.isActive = true;
  if (status === 'inactive') where.isActive = false;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        isActive: true,
        lastActiveAt: true,
        lastLoginAt: true,
        createdAt: true,
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data: users,
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
 * Get a single user with details
 */
export async function getUser(userId: string, orgId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId, orgId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      avatarUrl: true,
      phoneNumber: true,
      timezone: true,
      isActive: true,
      lastLoginAt: true,
      lastActiveAt: true,
      onboardingCompleted: true,
      createdAt: true,
    },
  });

  if (!user) throw ApiError.notFound('User');
  return user;
}

/**
 * Update logged-in user's own profile
 */
export async function updateProfile(
  userId: string,
  data: {
    name?: string;
    avatarUrl?: string;
    phoneNumber?: string;
    timezone?: string;
  }
) {
  return prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      phoneNumber: true,
      timezone: true,
    },
  });
}

/**
 * Change another user's role
 */
export async function changeUserRole(
  orgId: string,
  targetUserId: string,
  newRole: UserRole,
  actor: { id: string; orgId: string; role: UserRole; name: string }
) {
  if (actor.id === targetUserId) {
    throw ApiError.badRequest('You cannot change your own role');
  }

  const targetUser = await prisma.user.findFirst({
    where: { id: targetUserId, orgId },
  });

  if (!targetUser) throw ApiError.notFound('User');

  if (!canChangeRole(actor.role, targetUser.role, newRole)) {
    throw ApiError.forbidden('You do not have permission to make this role change');
  }

  await prisma.user.update({
    where: { id: targetUserId },
    data: { role: newRole },
  });

  await activityLogService.log({
    orgId,
    userId: actor.id,
    action: 'user.role_changed',
    resourceType: 'user',
    resourceId: targetUserId,
    resourceName: targetUser.name,
    changes: { role: { old: targetUser.role, new: newRole } },
  });
}

/**
 * Activate or deactivate a user
 */
export async function setUserActiveStatus(
  orgId: string,
  targetUserId: string,
  isActive: boolean,
  actor: { id: string; orgId: string; role: UserRole }
) {
  if (actor.id === targetUserId) {
    throw ApiError.badRequest('You cannot deactivate your own account');
  }

  const targetUser = await prisma.user.findFirst({
    where: { id: targetUserId, orgId },
  });

  if (!targetUser) throw ApiError.notFound('User');

  if (targetUser.role === 'owner') {
    throw ApiError.forbidden('Cannot deactivate the organization owner');
  }

  await prisma.user.update({
    where: { id: targetUserId },
    data: { isActive },
  });

  await activityLogService.log({
    orgId,
    userId: actor.id,
    action: isActive ? 'user.reactivated' : 'user.deactivated',
    resourceType: 'user',
    resourceId: targetUserId,
    resourceName: targetUser.name,
  });
}

/**
 * Remove a user from the organization
 */
export async function removeUser(
  orgId: string,
  targetUserId: string,
  actor: { id: string; orgId: string; role: UserRole }
) {
  if (actor.id === targetUserId) {
    throw ApiError.badRequest('You cannot remove yourself. Transfer ownership first.');
  }

  const targetUser = await prisma.user.findFirst({
    where: { id: targetUserId, orgId },
  });

  if (!targetUser) throw ApiError.notFound('User');

  if (targetUser.role === 'owner') {
    throw ApiError.forbidden('Cannot remove the organization owner');
  }

  await prisma.user.delete({ where: { id: targetUserId } });

  await activityLogService.log({
    orgId,
    userId: actor.id,
    action: 'user.removed',
    resourceType: 'user',
    resourceId: targetUserId,
    resourceName: targetUser.name,
  });
}

/**
 * Export team members as CSV string
 */
export async function exportUsersCSV(orgId: string): Promise<string> {
  const users = await prisma.user.findMany({
    where: { orgId },
    select: {
      name: true,
      email: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  const header = 'Name,Email,Role,Status,Last Login,Joined';
  const rows = users.map((u) =>
    [
      u.name,
      u.email,
      u.role,
      u.isActive ? 'Active' : 'Inactive',
      u.lastLoginAt?.toISOString() || 'Never',
      u.createdAt.toISOString(),
    ].join(',')
  );

  return [header, ...rows].join('\n');
}
