import { Request, Response } from 'express';
import reminderService from '../services/reminder.service';
import { asyncHandler } from '../middleware/error.middleware';
import logger from '../utils/logger';

export class ReminderController {
  /**
   * Get reminder statistics
   * GET /api/reminders/stats
   */
  getStats = asyncHandler(async (req: Request, res: Response) => {
    const stats = await reminderService.getStats();

    res.status(200).json({
      status: 'success',
      data: { stats },
    });
  });

  /**
   * Get list of projects needing reminder
   * GET /api/reminders/projects
   */
  getProjectsNeedingReminder = asyncHandler(async (req: Request, res: Response) => {
    const projects = await reminderService.getProjectsNeedingReminder();

    res.status(200).json({
      status: 'success',
      data: {
        projects,
        count: projects.length,
      },
    });
  });

  /**
   * Manually trigger reminder check
   * POST /api/reminders/trigger
   */
  triggerReminders = asyncHandler(async (req: Request, res: Response) => {
    logger.info(`Admin ${req.user!.userId} manually triggered reminder check`);

    // Trigger asynchronously
    reminderService
      .triggerManually()
      .then(() => logger.info('Manual reminder check completed'))
      .catch((error) => logger.error('Manual reminder check failed:', error));

    res.status(200).json({
      status: 'success',
      message: 'Reminder check triggered. Processing in background.',
    });
  });
}

export default new ReminderController();
