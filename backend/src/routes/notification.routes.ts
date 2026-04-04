// ============================================
// PulseOps CRM - Notification Routes
// ============================================

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import * as notificationController from '../controllers/notification.controller';

const router = Router();

// GET /api/users/notifications
router.get(
  '/notifications',
  authenticateToken,
  notificationController.getPreferences
);

// PUT /api/users/notifications
router.put(
  '/notifications',
  authenticateToken,
  notificationController.updatePreferences
);

export default router;
