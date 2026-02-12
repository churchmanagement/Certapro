import { Router } from 'express';
import notificationController from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import {
  notificationIdValidator,
  getNotificationsValidator,
  cleanupValidator,
} from '../validators/notification.validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get my notifications
router.get('/', getNotificationsValidator, notificationController.getMyNotifications);

// Mark all as read
router.patch('/read-all', notificationController.markAllAsRead);

// Cleanup old notifications (admin only)
router.delete(
  '/cleanup',
  requireRole(['ADMIN']),
  cleanupValidator,
  notificationController.cleanupOldNotifications
);

// Mark single notification as read
router.patch(
  '/:notificationId/read',
  notificationIdValidator,
  notificationController.markAsRead
);

export default router;
