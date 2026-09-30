import { describe, it, expect, vi, beforeEach } from 'vitest';
import prisma from '../lib/prisma';
import { 
  createTicket, 
  getTickets, 
  getTicketById, 
  updateTicket, 
  addMessage,
  assignTicket,
  changeTicketStatus,
  getTicketStats
} from './ticket.service';
import { activityLogService } from './activityLog.service';

const mockPrisma = prisma as any;

describe('Ticket Service', () => {
  const mockUser = {
    id: 'user-1',
    orgId: 'org-1',
    email: 'user@example.com',
    name: 'Test User',
    role: 'member',
    isActive: true,
  };

  const mockAdmin = {
    id: 'admin-1',
    orgId: 'org-1',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
    isActive: true,
  };

  const mockTicket = {
    id: 'ticket-1',
    orgId: 'org-1',
    userId: 'user-1',
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
    creator: mockUser,
    assignee: null,
    messages: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createTicket', () => {
    it('should create ticket successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.supportTicket.create.mockResolvedValue(mockTicket);
      (activityLogService.log as any).mockResolvedValue(undefined);

      const result = await createTicket({
        orgId: 'org-1',
        userId: 'user-1',
        title: 'Test Ticket',
        description: 'Test description',
        category: 'technical_support',
        priority: 'medium',
      });

      expect(result).toEqual(mockTicket);
      expect(mockPrisma.supportTicket.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orgId: 'org-1',
            userId: 'user-1',
            title: 'Test Ticket',
            ticketNumber: expect.stringMatching(/^TICKET-\d{4}$/),
          }),
        })
      );
    });

    it('should throw if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(createTicket({
        orgId: 'org-1',
        userId: 'user-1',
        title: 'Test Ticket',
        description: 'Test description',
        category: 'technical_support',
      })).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('getTickets', () => {
    it('should return paginated tickets', async () => {
      mockPrisma.supportTicket.findMany.mockResolvedValue([mockTicket]);
      mockPrisma.supportTicket.count.mockResolvedValue(1);

      const result = await getTickets('org-1', { page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual({ page: 1, limit: 20, total: 1, totalPages: 1 });
    });

    it('should filter by status', async () => {
      mockPrisma.supportTicket.findMany.mockResolvedValue([mockTicket]);
      mockPrisma.supportTicket.count.mockResolvedValue(1);

      await getTickets('org-1', { page: 1, limit: 20, status: 'open' });

      expect(mockPrisma.supportTicket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ orgId: 'org-1', status: 'open' }),
        })
      );
    });

    it('should filter by priority', async () => {
      mockPrisma.supportTicket.findMany.mockResolvedValue([mockTicket]);
      mockPrisma.supportTicket.count.mockResolvedValue(1);

      await getTickets('org-1', { page: 1, limit: 20, priority: 'high' });

      expect(mockPrisma.supportTicket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ orgId: 'org-1', priority: 'high' }),
        })
      );
    });

    it('should filter by assignee', async () => {
      mockPrisma.supportTicket.findMany.mockResolvedValue([mockTicket]);
      mockPrisma.supportTicket.count.mockResolvedValue(1);

      await getTickets('org-1', { page: 1, limit: 20, assigneeId: 'admin-1' });

      expect(mockPrisma.supportTicket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ orgId: 'org-1', assignedTo: 'admin-1' }),
        })
      );
    });

    it('should filter by creator for non-admins', async () => {
      mockPrisma.supportTicket.findMany.mockResolvedValue([mockTicket]);
      mockPrisma.supportTicket.count.mockResolvedValue(1);

      await getTickets('org-1', { page: 1, limit: 20, userId: 'user-1', userRole: 'member' });

      expect(mockPrisma.supportTicket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ orgId: 'org-1', userId: 'user-1' }),
        })
      );
    });
  });

  describe('getTicketById', () => {
    it('should return ticket with messages', async () => {
      const ticketWithMessages = {
        ...mockTicket,
        messages: [
          { id: 'msg-1', ticketId: 'ticket-1', userId: 'user-1', message: 'Hello', isInternal: false, createdAt: new Date() },
        ],
      };
      mockPrisma.supportTicket.findUnique.mockResolvedValue(ticketWithMessages);

      const result = await getTicketById('ticket-1', 'org-1');

      expect(result).toEqual(ticketWithMessages);
    });

    it('should throw if ticket not found', async () => {
      mockPrisma.supportTicket.findUnique.mockResolvedValue(null);

      await expect(getTicketById('invalid-id', 'org-1'))
        .rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('updateTicket', () => {
    it('should update ticket', async () => {
      const updatedTicket = { ...mockTicket, title: 'Updated Title', priority: 'high' };
      mockPrisma.supportTicket.findUnique.mockResolvedValue(mockTicket);
      mockPrisma.supportTicket.update.mockResolvedValue(updatedTicket);
      (activityLogService.log as any).mockResolvedValue(undefined);

      const result = await updateTicket('ticket-1', 'org-1', { title: 'Updated Title', priority: 'high' });

      expect(result.title).toBe('Updated Title');
      expect(result.priority).toBe('high');
    });
  });

  describe('assignTicket', () => {
    it('should assign ticket to admin', async () => {
      const assignedTicket = { ...mockTicket, assignedTo: 'admin-1', status: 'in_progress' };
      mockPrisma.supportTicket.findUnique.mockResolvedValue(mockTicket);
      mockPrisma.user.findUnique.mockResolvedValue(mockAdmin);
      mockPrisma.supportTicket.update.mockResolvedValue(assignedTicket);
      (activityLogService.log as any).mockResolvedValue(undefined);

      const result = await assignTicket('ticket-1', 'org-1', 'admin-1', 'admin-1');

      expect(result.assignedTo).toBe('admin-1');
      expect(result.status).toBe('in_progress');
    });

    it('should throw if assignee not in same org', async () => {
      mockPrisma.supportTicket.findUnique.mockResolvedValue(mockTicket);
      mockPrisma.user.findUnique.mockResolvedValue({ ...mockAdmin, orgId: 'org-2' });

      await expect(assignTicket('ticket-1', 'org-1', 'admin-1', 'admin-1'))
        .rejects.toMatchObject({ statusCode: 400, code: 'BAD_REQUEST' });
    });
  });

  describe('changeTicketStatus', () => {
    it('should change status to in_progress', async () => {
      const updatedTicket = { ...mockTicket, status: 'in_progress' };
      mockPrisma.supportTicket.findUnique.mockResolvedValue(mockTicket);
      mockPrisma.supportTicket.update.mockResolvedValue(updatedTicket);
      (activityLogService.log as any).mockResolvedValue(undefined);

      const result = await changeTicketStatus('ticket-1', 'org-1', 'in_progress', 'admin-1');

      expect(result.status).toBe('in_progress');
    });

    it('should set resolvedAt when resolving', async () => {
      const resolvedTicket = { ...mockTicket, status: 'resolved', resolvedAt: new Date() };
      mockPrisma.supportTicket.findUnique.mockResolvedValue({ ...mockTicket, status: 'in_progress' });
      mockPrisma.supportTicket.update.mockResolvedValue(resolvedTicket);
      (activityLogService.log as any).mockResolvedValue(undefined);

      const result = await changeTicketStatus('ticket-1', 'org-1', 'resolved', 'admin-1');

      expect(result.status).toBe('resolved');
      expect(result.resolvedAt).toBeInstanceOf(Date);
    });

    it('should set closedAt when closing', async () => {
      const closedTicket = { ...mockTicket, status: 'closed', closedAt: new Date() };
      mockPrisma.supportTicket.findUnique.mockResolvedValue({ ...mockTicket, status: 'resolved' });
      mockPrisma.supportTicket.update.mockResolvedValue(closedTicket);
      (activityLogService.log as any).mockResolvedValue(undefined);

      const result = await changeTicketStatus('ticket-1', 'org-1', 'closed', 'admin-1');

      expect(result.status).toBe('closed');
      expect(result.closedAt).toBeInstanceOf(Date);
    });
  });

  describe('addMessage', () => {
    it('should add public message', async () => {
      const newMessage = {
        id: 'msg-1',
        ticketId: 'ticket-1',
        userId: 'user-1',
        message: 'Test message',
        isInternal: false,
        createdAt: new Date(),
      };
      mockPrisma.supportTicket.findUnique.mockResolvedValue(mockTicket);
      mockPrisma.ticketMessage.create.mockResolvedValue(newMessage);
      (activityLogService.log as any).mockResolvedValue(undefined);

      const result = await addMessage('ticket-1', 'org-1', 'user-1', 'Test message', false);

      expect(result).toEqual(newMessage);
    });

    it('should add internal note', async () => {
      const internalMessage = {
        id: 'msg-1',
        ticketId: 'ticket-1',
        userId: 'admin-1',
        message: 'Internal note',
        isInternal: true,
        createdAt: new Date(),
      };
      mockPrisma.supportTicket.findUnique.mockResolvedValue(mockTicket);
      mockPrisma.ticketMessage.create.mockResolvedValue(internalMessage);
      (activityLogService.log as any).mockResolvedValue(undefined);

      const result = await addMessage('ticket-1', 'org-1', 'admin-1', 'Internal note', true);

      expect(result.isInternal).toBe(true);
    });
  });

  describe('getTicketStats', () => {
    it('should return ticket statistics', async () => {
      mockPrisma.supportTicket.count
        .mockResolvedValueOnce(10)  // total
        .mockResolvedValueOnce(3)   // open
        .mockResolvedValueOnce(2)   // in_progress
        .mockResolvedValueOnce(4)   // resolved
        .mockResolvedValueOnce(1);  // closed

      const result = await getTicketStats('org-1');

      expect(result).toEqual({
        total: 10,
        open: 3,
        in_progress: 2,
        resolved: 4,
        closed: 1,
      });
    });
  });
});