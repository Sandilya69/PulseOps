// ============================================
// PulseOps CRM - Support Ticket Controller
// ============================================

import { Request, Response, NextFunction } from 'express';
import * as ticketService from '../services/ticket.service';
import { hasPermission } from '../lib/permissions';
import { TicketStatus, TicketPriority } from '@prisma/client';

export async function createTicket(req: Request, res: Response, next: NextFunction) {
  try {
    const ticket = await ticketService.createTicket(
      req.params.orgId,
      req.user!.id,
      req.body
    );
    res.status(201).json({ success: true, data: ticket });
  } catch (err) {
    next(err);
  }
}

export async function listTickets(req: Request, res: Response, next: NextFunction) {
  try {
    const canViewAll = hasPermission(req.user!.role, 'ticket.view_all');
    
    const filters = {
      status: req.query.status as TicketStatus,
      priority: req.query.priority as TicketPriority,
      search: req.query.search as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 50
    };

    const result = await ticketService.listTickets(req.params.orgId, req.user!.id, canViewAll, filters);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

export async function getTicketDetails(req: Request, res: Response, next: NextFunction) {
  try {
    const canViewAll = hasPermission(req.user!.role, 'ticket.view_all');
    const ticket = await ticketService.getTicketDetails(req.params.orgId, req.params.ticketNumber, req.user!.id, canViewAll);
    res.json({ success: true, data: ticket });
  } catch (err) {
    next(err);
  }
}

export async function addMessage(req: Request, res: Response, next: NextFunction) {
  try {
    const msg = await ticketService.addMessage(req.params.id, req.user!.id, req.body.message, req.body.isInternal);
    res.status(201).json({ success: true, data: msg });
  } catch (err) {
    next(err);
  }
}

export async function updateStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const ticket = await ticketService.updateTicketStatus(req.params.id, req.body.status, req.user!.id);
    res.json({ success: true, data: ticket });
  } catch (err) {
    next(err);
  }
}
