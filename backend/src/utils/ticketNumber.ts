// ============================================
// PulseOps CRM - Ticket Number Generator
// ============================================

import prisma from '../lib/prisma';

/**
 * Generate the next sequential ticket number for an organization
 * Format: TICKET-XXXX (zero-padded to 4 digits)
 */
export async function generateTicketNumber(orgId: string): Promise<string> {
  const count = await prisma.supportTicket.count({
    where: { orgId },
  });

  const nextNumber = count + 1;
  return `TICKET-${nextNumber.toString().padStart(4, '0')}`;
}
