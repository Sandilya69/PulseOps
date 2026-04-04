// ============================================
// PulseOps CRM - Contact Service
// ============================================

import prisma from '../lib/prisma';
import { ApiError } from '../middleware/errorHandler.middleware';
import { activityLogService } from './activityLog.service';

/**
 * Create a new CRM contact
 */
export async function createContact(
  orgId: string,
  userId: string,
  data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    company?: string;
    jobTitle?: string;
    source?: string;
    tags?: string[];
  }
) {
  const contact = await prisma.contact.create({
    data: {
      orgId,
      ...data
    }
  });

  await activityLogService.log({
    orgId,
    userId,
    action: 'contact.created',
    resourceType: 'contact',
    resourceId: contact.id,
    resourceName: `${contact.firstName} ${contact.lastName}`
  });

  return contact;
}

/**
 * List CRM contacts
 */
export async function listContacts(
  orgId: string,
  filters: { search?: string; page?: number; limit?: number }
) {
  const where: any = { orgId };

  if (filters.search) {
    where.OR = [
      { firstName: { contains: filters.search, mode: 'insensitive' } },
      { lastName: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } },
      { company: { contains: filters.search, mode: 'insensitive' } }
    ];
  }

  const skip = ((filters.page || 1) - 1) * (filters.limit || 50);

  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: filters.limit || 50
    }),
    prisma.contact.count({ where })
  ]);

  return { data: contacts, total };
}

/**
 * Get individual CRM contact
 */
export async function getContact(orgId: string, id: string) {
  const contact = await prisma.contact.findFirst({
    where: { id, orgId }
  });

  if (!contact) throw ApiError.notFound('Contact');
  return contact;
}

/**
 * Update CRM contact
 */
export async function updateContact(
  orgId: string,
  id: string,
  userId: string,
  data: any
) {
  const before = await prisma.contact.findFirst({ where: { id, orgId } });
  if (!before) throw ApiError.notFound('Contact');

  const contact = await prisma.contact.update({
    where: { id },
    data: { ...data, updatedAt: new Date() }
  });

  const changes = activityLogService.diffChanges(before as any, contact as any);

  await activityLogService.log({
    orgId,
    userId,
    action: 'contact.updated',
    resourceType: 'contact',
    resourceId: id,
    resourceName: `${contact.firstName} ${contact.lastName}`,
    changes
  });

  return contact;
}

/**
 * Delete CRM contact
 */
export async function deleteContact(orgId: string, id: string, userId: string) {
  const contact = await prisma.contact.findFirst({ where: { id, orgId } });
  if (!contact) throw ApiError.notFound('Contact');

  await prisma.contact.delete({ where: { id } });

  await activityLogService.log({
    orgId,
    userId,
    action: 'contact.deleted',
    resourceType: 'contact',
    resourceId: id,
    resourceName: `${contact.firstName} ${contact.lastName}`
  });
}
