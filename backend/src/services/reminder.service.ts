import cron from 'node-cron';
import prisma from '../config/database';
import { ProjectStatus } from '@prisma/client';
import notificationService from './notification.service';
import logger from '../utils/logger';
import { config } from '../config';

class ReminderService {
  private cronJob: cron.ScheduledTask | null = null;

  /**
   * Start the reminder cron job
   */
  start() {
    if (this.cronJob) {
      logger.warn('Reminder cron job already running');
      return;
    }

    // Schedule: Run daily at 9 AM (configurable via REMINDER_CRON_SCHEDULE)
    const schedule = config.reminder.cronSchedule;

    this.cronJob = cron.schedule(schedule, async () => {
      await this.sendPendingReminders();
    });

    logger.info(`Reminder cron job started with schedule: ${schedule}`);
  }

  /**
   * Stop the reminder cron job
   */
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      logger.info('Reminder cron job stopped');
    }
  }

  /**
   * Manually trigger reminder check (for testing)
   */
  async triggerManually() {
    logger.info('Manually triggering reminder check');
    await this.sendPendingReminders();
  }

  /**
   * Send reminders for pending projects older than threshold
   */
  private async sendPendingReminders() {
    try {
      logger.info('Starting reminder check for pending projects');

      const thresholdDays = config.reminder.thresholdDays;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - thresholdDays);

      // Find pending projects older than threshold that haven't been reminded yet
      const pendingProjects = await prisma.project.findMany({
        where: {
          status: ProjectStatus.PENDING,
          deletedAt: null,
          createdAt: { lt: cutoffDate },
          OR: [
            { reminderSentAt: null },
            { reminderSentAt: { lt: cutoffDate } }, // Re-remind if last reminder was > threshold days ago
          ],
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
          acceptances: {
            select: {
              userId: true,
            },
          },
        },
      });

      if (pendingProjects.length === 0) {
        logger.info('No projects requiring reminders');
        return;
      }

      logger.info(`Found ${pendingProjects.length} projects requiring reminders`);

      // Process each project
      for (const project of pendingProjects) {
        try {
          // Get users who accepted
          const acceptedUserIds = project.acceptances.map((a) => a.userId);

          // Get all active users who haven't accepted
          const usersToRemind = await prisma.user.findMany({
            where: {
              isActive: true,
              role: 'USER',
              id: {
                notIn: [...acceptedUserIds, project.createdById], // Exclude creator and users who accepted
              },
            },
            select: {
              id: true,
            },
          });

          if (usersToRemind.length === 0) {
            logger.info(
              `No users to remind for project ${project.id} (all have accepted or no active users)`
            );
            continue;
          }

          const userIds = usersToRemind.map((u) => u.id);

          // Send reminders
          await notificationService.sendProjectReminder(project.id, project.title, userIds);

          logger.info(
            `Sent reminders for project ${project.id} to ${userIds.length} users (created ${this.formatDaysAgo(project.createdAt)} days ago)`
          );
        } catch (error) {
          logger.error(`Failed to send reminders for project ${project.id}:`, error);
          // Continue with next project even if one fails
        }
      }

      logger.info(`Reminder check completed. Processed ${pendingProjects.length} projects.`);
    } catch (error) {
      logger.error('Error in reminder cron job:', error);
    }
  }

  /**
   * Get reminder statistics
   */
  async getStats() {
    const thresholdDays = config.reminder.thresholdDays;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - thresholdDays);

    const [pendingTotal, pendingNeedingReminder, remindedToday] = await Promise.all([
      // Total pending projects
      prisma.project.count({
        where: {
          status: ProjectStatus.PENDING,
          deletedAt: null,
        },
      }),

      // Pending projects needing reminder
      prisma.project.count({
        where: {
          status: ProjectStatus.PENDING,
          deletedAt: null,
          createdAt: { lt: cutoffDate },
          OR: [
            { reminderSentAt: null },
            { reminderSentAt: { lt: cutoffDate } },
          ],
        },
      }),

      // Projects reminded today
      prisma.project.count({
        where: {
          status: ProjectStatus.PENDING,
          reminderSentAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    return {
      thresholdDays,
      schedule: config.reminder.cronSchedule,
      isRunning: this.cronJob !== null,
      stats: {
        pendingTotal,
        pendingNeedingReminder,
        remindedToday,
      },
    };
  }

  /**
   * Get list of projects that will receive reminders
   */
  async getProjectsNeedingReminder() {
    const thresholdDays = config.reminder.thresholdDays;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - thresholdDays);

    const projects = await prisma.project.findMany({
      where: {
        status: ProjectStatus.PENDING,
        deletedAt: null,
        createdAt: { lt: cutoffDate },
        OR: [
          { reminderSentAt: null },
          { reminderSentAt: { lt: cutoffDate } },
        ],
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        reminderSentAt: true,
        currentApprovals: true,
        requiredApprovals: true,
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            acceptances: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return projects.map((project) => ({
      ...project,
      daysOld: this.formatDaysAgo(project.createdAt),
      daysSinceLastReminder: project.reminderSentAt
        ? this.formatDaysAgo(project.reminderSentAt)
        : null,
    }));
  }

  /**
   * Helper to calculate days ago
   */
  private formatDaysAgo(date: Date): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
}

export default new ReminderService();
