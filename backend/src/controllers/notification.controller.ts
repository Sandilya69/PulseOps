// ============================================
// PulseOps CRM - Notification Controller
// ============================================

import { Request, Response, NextFunction } from 'express';
import * as notificationService from '../services/notification.service';

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
