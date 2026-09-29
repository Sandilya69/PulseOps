import { describe, it, expect, vi } from 'vitest';
import { generateTicketNumber } from './ticketNumber.js';

vi.mock('../lib/prisma', () => ({
  default: {
    supportTicket: {
      count: vi.fn(),
    },
  },
}));

describe('ticketNumber utils', () => {
  describe('generateTicketNumber', () => {
    it('should generate ticket number with sequential count', async () => {
      const { default: prisma } = await import('../lib/prisma');
      prisma.supportTicket.count.mockResolvedValue(5);

      const ticket = await generateTicketNumber('org-1');

      expect(ticket).toBe('TICKET-0006');
    });

    it('should generate TICKET-0001 for empty organization', async () => {
      const { default: prisma } = await import('../lib/prisma');
      prisma.supportTicket.count.mockResolvedValue(0);

      const ticket = await generateTicketNumber('org-1');

      expect(ticket).toBe('TICKET-0001');
    });

    it('should handle large numbers', async () => {
      const { default: prisma } = await import('../lib/prisma');
      prisma.supportTicket.count.mockResolvedValue(9999);

      const ticket = await generateTicketNumber('org-1');

      expect(ticket).toBe('TICKET-10000');
    });
  });
});