// ============================================
// PulseOps CRM - Organization Service
// ============================================

import prisma from '../lib/prisma';
import { ApiError } from '../middleware/errorHandler.middleware';
import { activityLogService } from './activityLog.service';

/**
 * Get organization by ID
 */
export async function getOrganization(orgId: string) {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    include: {
      _count: {
        select: {
          users: true,
          supportTickets: true,
          contacts: true,
        },
      },
    },
  });

  if (!org) throw ApiError.notFound('Organization');
  return org;
}

/**
 * Update organization details
 */
export async function updateOrganization(
  orgId: string,
  data: {
    name?: string;
    logoUrl?: string;
    website?: string;
    industry?: string;
    companySize?: string;
    billingEmail?: string;
  },
  actor: { id: string; orgId: string }
) {
  const before = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!before) throw ApiError.notFound('Organization');

  const org = await prisma.organization.update({
    where: { id: orgId },
    data: {
      ...data,
      updatedAt: new Date(),
    },
  });

  // Log changes
  const changes = activityLogService.diffChanges(
    before as any,
    org as any
  );

  await activityLogService.log({
    orgId,
    userId: actor.id,
    action: 'org.updated',
    resourceType: 'organization',
    resourceId: orgId,
    resourceName: org.name,
    changes,
  });

  return org;
}

/**
 * Get organization usage statistics
 */
export async function getOrganizationStats(orgId: string) {
  const [userCount, activeUserCount, ticketCount, openTicketCount] = await Promise.all([
    prisma.user.count({ where: { orgId } }),
    prisma.user.count({
      where: {
        orgId,
        isActive: true,
        lastActiveAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.supportTicket.count({ where: { orgId } }),
    prisma.supportTicket.count({ where: { orgId, status: 'open' } }),
  ]);

  return {
    totalMembers: userCount,
    activeMembers7d: activeUserCount,
    totalTickets: ticketCount,
    openTickets: openTicketCount,
  };
}

/**
 * Transfer organization ownership to another user
 */
export async function transferOwnership(
  orgId: string,
  newOwnerId: string,
  actor: { id: string; orgId: string; name: string }
) {
  // Verify new owner exists and is in the org
  const newOwner = await prisma.user.findFirst({
    where: { id: newOwnerId, orgId, isActive: true },
  });

  if (!newOwner) {
    throw ApiError.badRequest('Target user not found in this organization');
  }

  await prisma.$transaction(async (tx) => {
    // Demote current owner to admin
    await tx.user.update({
      where: { id: actor.id },
      data: { role: 'admin' },
    });

    // Promote new owner
    await tx.user.update({
      where: { id: newOwnerId },
      data: { role: 'owner' },
    });

    // Update org owner
    await tx.organization.update({
      where: { id: orgId },
      data: { ownerId: newOwnerId },
    });
  });

  await activityLogService.log({
    orgId,
    userId: actor.id,
    action: 'org.ownership_transferred',
    resourceType: 'organization',
    resourceId: orgId,
    metadata: { previousOwner: actor.id, newOwner: newOwnerId },
  });
}

/**
 * Delete organization and all associated data
 */
export async function deleteOrganization(
  orgId: string,
  actor: { id: string; orgId: string }
) {
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) throw ApiError.notFound('Organization');

  // Prisma cascades handle related data deletion
  await prisma.organization.delete({ where: { id: orgId } });
}
