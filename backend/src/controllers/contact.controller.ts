// ============================================
// PulseOps CRM - Contact Controller
// ============================================

import { Request, Response, NextFunction } from 'express';
import * as contactService from '../services/contact.service';

export async function createContact(req: Request, res: Response, next: NextFunction) {
  try {
    const contact = await contactService.createContact(req.params.orgId, req.user!.id, req.body);
    res.status(201).json({ success: true, data: contact });
  } catch (error) {
    next(error);
  }
}

export async function listContacts(req: Request, res: Response, next: NextFunction) {
  try {
    const filters = {
      search: req.query.search as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 50
    };
    const result = await contactService.listContacts(req.params.orgId, filters);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getContact(req: Request, res: Response, next: NextFunction) {
  try {
    const contact = await contactService.getContact(req.params.orgId, req.params.id);
    res.json({ success: true, data: contact });
  } catch (error) {
    next(error);
  }
}

export async function updateContact(req: Request, res: Response, next: NextFunction) {
  try {
    const contact = await contactService.updateContact(req.params.orgId, req.params.id, req.user!.id, req.body);
    res.json({ success: true, message: 'Contact updated', data: contact });
  } catch (error) {
    next(error);
  }
}

export async function deleteContact(req: Request, res: Response, next: NextFunction) {
  try {
    await contactService.deleteContact(req.params.orgId, req.params.id, req.user!.id);
    res.json({ success: true, message: 'Contact deleted' });
  } catch (error) {
    next(error);
  }
}
