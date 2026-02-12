import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import notificationService from '../services/notification.service';
import { ValidationError } from '../utils/errors';
import { asyncHandler } from '../middleware/error.middleware';
import logger from '../utils/logger';

export class NotificationController {
  /**
   * Get notifications for current user
   * GET /api/notifications
   */
  getMyNotifications = asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await notificationService.getUserNotifications(
      req.user!.userId,
      limit,
      offset
    );

    res.status(200).json({
      status: 'success',
      data: {
        notifications: result.notifications,
        unreadCount: result.unreadCount,
        count: result.notifications.length,
      },
    });
  });

  /**
   * Mark notification as read
   * PATCH /api/notifications/:notificationId/read
   */
  markAsRead = asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    await notificationService.markAsRead(req.params.notificationId, req.user!.userId);

    logger.info(`Notification ${req.params.notificationId} marked as read by user ${req.user!.userId}`);

    res.status(200).json({
      status: 'success',
      message: 'Notification marked as read',
    });
  });

  /**
   * Mark all notifications as read
   * PATCH /api/notifications/read-all
   */
  markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
    const count = await notificationService.markAllAsRead(req.user!.userId);

    logger.info(`${count} notifications marked as read for user ${req.user!.userId}`);

    res.status(200).json({
      status: 'success',
      data: { count },
      message: `${count} notifications marked as read`,
    });
  });

  /**
   * Cleanup old notifications (admin only)
   * DELETE /api/notifications/cleanup
   */
  cleanupOldNotifications = asyncHandler(async (req: Request, res: Response) => {
    const daysOld = parseInt(req.query.daysOld as string) || 90;

    const count = await notificationService.cleanupOldNotifications(daysOld);

    logger.info(`Cleaned up ${count} old notifications (admin action)`);

    res.status(200).json({
      status: 'success',
      data: { count },
      message: `${count} old notifications deleted`,
    });
  });
}

export default new NotificationController();
