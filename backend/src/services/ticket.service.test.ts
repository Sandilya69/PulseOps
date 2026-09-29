import { describe, it, expect, vi, beforeEach } from 'vitest';
import prisma from '../lib/prisma';
import { createTicket, listTickets, getTicketDetails, addMessage, updateTicketStatus } from './ticket.service';
import { generateTicketNumber } from '../utils/ticketNumber';
import { activityLogService } from './activityLog.service';
import { TicketStatus, TicketPriority, TicketCategory } from '@prisma/client';
import { ApiError } from '../middleware/errorHandler.middleware';

const mockPrisma = prisma as any;

describe('Ticket Service', () => {
  const mockOrgId = 'test-org-id';
  const mockUserId = 'test-user-id';
  const mockAdminId = 'admin-user-id';

  const mockTicket = {
    id: 'test-ticket-id',
    orgId: mockOrgId,
    userId: mockUserId,
    ticketNumber: 'TICKET-0001',
    title: 'Test Ticket',
    description: 'Test description',
    category: 'technical_support',
    priority: 'medium',
    status: 'open',
    assignedTo: null,
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    resolvedAt: null,
    closedAt: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createTicket', () => {
    it('should create ticket with sequential number', async () => {
      (generateTicketNumber as any).mockResolvedValue('TICKET-0001');
      mockPrisma.supportTicket.create.mockResolvedValue({ ...mockTicket, ticketNumber: 'TICKET-0001' });
      (activityLogService.log as any).mockResolvedValue(undefined);

      const result = await createTicket(mockOrgId, mockUserId, {
        title: 'Test Ticket',
        description: 'Test description',
        category: 'technical_support',
        priority: 'medium',
      });

      expect(result.ticketNumber).toBe('TICKET-0001');
      expect(result.title).toBe('Test Ticket');
      expect(result.category).toBe('technical_support');
      expect(result.priority).toBe('medium');
      expect(generateTicketNumber).toHaveBeenCalledWith(mockOrgId);
      expect(activityLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ticket.created',
          resourceType: 'ticket',
        })
      );
    });

    it('should include tags if provided', async () => {
      (generateTicketNumber as any).mockResolvedValue('TICKET-0002');
      mockPrisma.supportTicket.create.mockResolvedValue({ ...mockTicket, ticketNumber: 'TICKET-0002', tags: ['bug', 'urgent'] });
      (activityLogService.log as any).mockResolvedValue(undefined);

      const result = await createTicket(mockOrgId, mockUserId, {
        title: 'Test Ticket',
        description: 'Test description',
        category: 'bug',
        priority: 'high',
        tags: ['bug', 'urgent'],
      });

      expect(result.tags).toEqual(['bug', 'urgent']);
    });
  });

  describe('listTickets', () => {
    it('should return all tickets for admin', async () => {
      const tickets = [mockTicket, { ...mockTicket, id: 'ticket-2', ticketNumber: 'TICKET-0002' }];
      mockPrisma.supportTicket.findMany.mockResolvedValue(tickets);
      mockPrisma.supportTicket.count.mockResolvedValue(2);

      const result = await listTickets(mockOrgId, mockAdminId, true, { page: 1, limit: 50 });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(mockPrisma.supportTicket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ orgId: mockOrgId }),
        })
      );
    });

    it('should return only user tickets for non-admin', async () => {
      const tickets = [mockTicket];
      mockPrisma.supportTicket.findMany.mockResolvedValue(tickets);
      mockPrisma.supportTicket.count.mockResolvedValue(1);

      const result = await listTickets(mockOrgId, mockUserId, false, { page: 1, limit: 50 });

      expect(result.data).toHaveLength(1);
      expect(mockPrisma.supportTicket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ orgId: mockOrgId, userId: mockUserId }),
        })
      );
    });

    it('should apply status filter', async () => {
      mockPrisma.supportTicket.findMany.mockResolvedValue([]);
      mockPrisma.supportTicket.count.mockResolvedValue(0);

      await listTickets(mockOrgId, mockUserId, false, { status: 'open' });

      expect(mockPrisma.supportTicket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'open' }),
        })
      );
    });

    it('should apply priority filter', async () => {
      mockPrisma.supportTicket.findMany.mockResolvedValue([]);
      mockPrisma.supportTicket.count.mockResolvedValue(0);

      await listTickets(mockOrgId, mockUserId, false, { priority: 'high' });

      expect(mockPrisma.supportTicket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ priority: 'high' }),
        })
      );
    });

    it('should apply search filter', async () => {
      mockPrisma.supportTicket.findMany.mockResolvedValue([]);
      mockPrisma.supportTicket.count.mockResolvedValue(0);

      await listTickets(mockOrgId, mockUserId, false, { search: 'error' });

      expect(mockPrisma.supportTicket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ title: expect.any(Object) }),
              expect.objectContaining({ ticketNumber: expect.any(Object) }),
            ]),
          }),
        })
      );
    });

    it('should apply pagination', async () => {
      mockPrisma.supportTicket.findMany.mockResolvedValue([]);
      mockPrisma.supportTicket.count.mockResolvedValue(0);

      await listTickets(mockOrgId, mockUserId, false, { page: 2, limit: 10 });

      expect(mockPrisma.supportTicket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      );
    });
  });

  describe('getTicketDetails', () => {
    it('should return ticket with messages for owner', async () => {
      const ticketWithMessages = {
        ...mockTicket,
        creator: { name: 'Test User', avatarUrl: null },
        assignee: null,
        messages: [
          { id: 'msg-1', message: 'Hello', isInternal: false, createdAt: new Date(), user: { name: 'Test User', avatarUrl: null, role: 'member' } },
        ],
      };
      mockPrisma.supportTicket.findFirst.mockResolvedValue(ticketWithMessages);

      const result = await getTicketDetails(mockOrgId, 'TICKET-0001', mockUserId, false);

      expect(result).toEqual(ticketWithMessages);
    });

    it('should throw not found for non-existent ticket', async () => {
      mockPrisma.supportTicket.findFirst.mockResolvedValue(null);

      await expect(getTicketDetails(mockOrgId, 'TICKET-9999', mockUserId, false))
        .rejects.toMatchObject({ statusCode: 404 });
    });

    it('should throw forbidden for non-owner non-admin', async () => {
      const otherUserTicket = { ...mockTicket, userId: 'other-user-id' };
      mockPrisma.supportTicket.findFirst.mockResolvedValue(otherUserTicket);

      await expect(getTicketDetails(mockOrgId, 'TICKET-0001', mockUserId, false))
        .rejects.toMatchObject({ statusCode: 403 });
    });

    it('should hide internal messages for non-admin', async () => {
      const ticketWithInternal = {
        ...mockTicket,
        messages: [
          { id: 'msg-1', message: 'Public', isInternal: false, createdAt: new Date(), user: { name: 'Test User', avatarUrl: null, role: 'member' } },
          { id: 'msg-2', message: 'Internal', isInternal: true, createdAt: new Date(), user: { name: 'Admin', avatarUrl: null, role: 'admin' } },
        ],
      };
      mockPrisma.supportTicket.findFirst.mockResolvedValue(ticketWithInternal);

      const result = await getTicketDetails(mockOrgId, 'TICKET-0001', mockUserId, false);

      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].isInternal).toBe(false);
    });
  });

  describe('addMessage', () => {
    it('should add message to ticket', async () => {
      mockPrisma.supportTicket.findUnique.mockResolvedValue(mockTicket);
      mockPrisma.ticketMessage.create.mockResolvedValue({
        id: 'msg-1',
        ticketId: mockTicket.id,
        userId: mockUserId,
        message: 'Test message',
        isInternal: false,
        createdAt: new Date(),
      });
      mockPrisma.supportTicket.update.mockResolvedValue({});

      const result = await addMessage(mockTicket.id, mockUserId, 'Test message', false);

      expect(result.message).toBe('Test message');
      expect(result.isInternal).toBe(false);
      expect(mockPrisma.supportTicket.update).toHaveBeenCalledWith({
        where: { id: mockTicket.id },
        data: { updatedAt: expect.any(Date) },
      });
    });

    it('should throw not found for non-existent ticket', async () => {
      mockPrisma.supportTicket.findUnique.mockResolvedValue(null);

      await expect(addMessage('non-existent', mockUserId, 'Test message'))
        .rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('updateTicketStatus', () => {
    it('should update ticket status to resolved', async () => {
      const updatedTicket = { ...mockTicket, status: 'resolved', resolvedAt: new Date() };
      mockPrisma.supportTicket.update.mockResolvedValue(updatedTicket);
      (activityLogService.log as any).mockResolvedValue(undefined);

      const result = await updateTicketStatus(mockTicket.id, 'resolved', mockAdminId);

      expect(result.status).toBe('resolved');
      expect(result.resolvedAt).toBeDefined();
      expect(activityLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ticket.resolved',
          metadata: { status: 'resolved' },
        })
      );
    });

    it('should update ticket status to closed', async () => {
      const updatedTicket = { ...mockTicket, status: 'closed', closedAt: new Date() };
      mockPrisma.supportTicket.update.mockResolvedValue(updatedTicket);
      (activityLogService.log as any).mockResolvedValue(undefined);

      const result = await updateTicketStatus(mockTicket.id, 'closed', mockAdminId);

      expect(result.status).toBe('closed');
      expect(result.closedAt).toBeDefined();
    });

    it('should not set resolvedAt for other statuses', async () => {
      const updatedTicket = { ...mockTicket, status: 'in_progress', resolvedAt: null };
      mockPrisma.supportTicket.update.mockResolvedValue(updatedTicket);
      (activityLogService.log as any).mockResolvedValue(undefined);

      const result = await updateTicketStatus(mockTicket.id, 'in_progress', mockAdminId);

      expect(result.status).toBe('in_progress');
      expect(result.resolvedAt).toBeNull();
    });
  });
});