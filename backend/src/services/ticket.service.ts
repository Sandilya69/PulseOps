// ============================================
// PulseOps CRM - Support Ticket Service
// ============================================

import { TicketStatus, TicketPriority, TicketCategory } from '@prisma/client';
import prisma from '../lib/prisma';
import { ApiError } from '../middleware/errorHandler.middleware';
import { generateTicketNumber } from '../utils/ticketNumber';
import { activityLogService } from './activityLog.service';

/**
 * Create a new support ticket
 */
export async function createTicket(
  orgId: string,
  userId: string,
  data: { title: string; description: string; category: TicketCategory; priority: TicketPriority; tags?: string[] }
) {
  const ticketNumber = await generateTicketNumber(orgId);

  const ticket = await prisma.supportTicket.create({
    data: {
      orgId,
      userId,
      ticketNumber,
      title: data.title,
      description: data.description,
      category: data.category,
      priority: data.priority,
      tags: data.tags || []
    }
  });

  await activityLogService.log({
    orgId,
    userId,
    action: 'ticket.created',
    resourceType: 'ticket',
    resourceId: ticket.id,
    resourceName: ticketNumber
  });

  // Future: Trigger email notification to Support Team

  return ticket;
}

/**
 * List support tickets (Admins see all, Users see theirs)
 */
export async function listTickets(
  orgId: string,
  userId: string,
  canViewAll: boolean,
  filters: { status?: TicketStatus; priority?: TicketPriority; search?: string; page?: number; limit?: number }
) {
  const where: any = { orgId };

  if (!canViewAll) {
    where.userId = userId;
  }

  if (filters.status) where.status = filters.status;
  if (filters.priority) where.priority = filters.priority;
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { ticketNumber: { contains: filters.search, mode: 'insensitive' } }
    ];
  }

  const skip = ((filters.page || 1) - 1) * (filters.limit || 50);

  const [tickets, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      include: {
        creator: { select: { name: true, avatarUrl: true } },
        assignee: { select: { name: true, avatarUrl: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: filters.limit || 50
    }),
    prisma.supportTicket.count({ where })
  ]);

  return { data: tickets, total };
}

/**
 * Get ticket details with messages
 */
export async function getTicketDetails(orgId: string, ticketNumber: string, userId: string, canViewAll: boolean) {
  const ticket = await prisma.supportTicket.findFirst({
    where: { orgId, ticketNumber },
    include: {
      creator: { select: { name: true, avatarUrl: true, email: true } },
      assignee: { select: { name: true, avatarUrl: true } },
      messages: {
        where: canViewAll ? undefined : { isInternal: false },
        include: { user: { select: { name: true, avatarUrl: true, role: true } } },
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  if (!ticket) throw ApiError.notFound('Ticket');
  if (!canViewAll && ticket.userId !== userId) throw ApiError.forbidden();

  return ticket;
}

/**
 * Add message to a ticket
 */
export async function addMessage(
  ticketId: string,
  userId: string,
  message: string,
  isInternal: boolean = false
) {
  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId }});
  if (!ticket) throw ApiError.notFound('Ticket');

  const ticketMsg = await prisma.ticketMessage.create({
    data: {
      ticketId,
      userId,
      message,
      isInternal
    }
  });

  // Update ticket updatedAt timestamp
  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { updatedAt: new Date() }
  });

  return ticketMsg;
}

/**
 * Alter ticket status
 */
export async function updateTicketStatus(ticketId: string, status: TicketStatus, userId: string) {
  const ticket = await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { 
      status, 
      resolvedAt: status === 'resolved' ? new Date() : null,
      closedAt: status === 'closed' ? new Date() : null,
      updatedAt: new Date()
    }
  });

  await activityLogService.log({
    orgId: ticket.orgId,
    userId,
    action: `ticket.${status}`,
    resourceType: 'ticket',
    resourceId: ticket.id,
    resourceName: ticket.ticketNumber,
    metadata: { status }
  });

  return ticket;
}
