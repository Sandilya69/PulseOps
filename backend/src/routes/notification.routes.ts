// ============================================
// PulseOps CRM - Notification Routes
// ============================================

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import * as notificationController from '../controllers/notification.controller';

const router = Router();

// GET /api/users/me/notifications — List user notifications
router.get(
  '/me/notifications',
  authenticateToken,
  notificationController.listNotifications
);

// PUT /api/users/me/notifications/:id/read — Mark notification as read
router.put(
  '/me/notifications/:id/read',
  authenticateToken,
  notificationController.markAsRead
);

// PUT /api/users/me/notifications/read-all — Mark all notifications as read
router.put(
  '/me/notifications/read-all',
  authenticateToken,
  notificationController.markAllAsRead
);

// GET /api/users/notifications — Get preferences (legacy route)
router.get(
  '/notifications',
  authenticateToken,
  notificationController.getPreferences
);

// PUT /api/users/notifications — Update preferences (legacy route)
router.put(
  '/notifications',
  authenticateToken,
  notificationController.updatePreferences
);

export default router;
