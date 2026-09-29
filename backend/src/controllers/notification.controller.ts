// ============================================
// PulseOps CRM - Notification Controller
// ============================================

import { Request, Response, NextFunction } from 'express';
import * as notificationService from '../services/notification.service';

export async function listNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    const unreadOnly = req.query.unread === 'true';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 30;

    const result = await notificationService.listNotifications(req.user!.id, { unreadOnly, page, limit });
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function markAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    await notificationService.markAsRead(req.user!.id, req.params.id as string);
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    next(error);
  }
}

export async function markAllAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    await notificationService.markAllAsRead(req.user!.id);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
}

export async function getPreferences(req: Request, res: Response, next: NextFunction) {
  try {
    const prefs = await notificationService.getPreferences(req.user!.id);
    res.json({ success: true, data: prefs });
  } catch (error) {
    next(error);
  }
}

export async function updatePreferences(req: Request, res: Response, next: NextFunction) {
  try {
    const prefs = await notificationService.updatePreferences(req.user!.id, req.body);
    res.json({ success: true, message: 'Notification preferences updated', data: prefs });
  } catch (error) {
    next(error);
  }
}
