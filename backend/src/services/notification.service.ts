import prisma from '../config/database';
import { NotificationType, NotificationStatus, DeliveryChannel, DeliveryStatus, UserRole } from '@prisma/client';
import logger from '../utils/logger';
import smsService from './sms.service';
import emailService from './email.service';
import pushService from './push.service';
import { config } from '../config';

interface SendNotificationDto {
  userId: string;
  projectId?: string;
  type: NotificationType;
  title: string;
  message: string;
  channels?: DeliveryChannel[];
  data?: { [key: string]: string };
}

interface NotificationResult {
  notificationId: string;
  deliveryResults: {
    channel: DeliveryChannel;
    success: boolean;
    error?: string;
  }[];
}

class NotificationService {
  /**
   * Send a notification to a user via all configured channels
   */
  async sendNotification(dto: SendNotificationDto): Promise<NotificationResult> {
    const { userId, projectId, type, title, message, channels, data } = dto;

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        fcmToken: true,
        notificationPreferences: true,
      },
    });

    if (!user) {
      logger.error(`User not found: ${userId}`);
      throw new Error('User not found');
    }

    // Parse notification preferences
    const prefs = user.notificationPreferences as any || {
      push: true,
      sms: true,
      email: true,
      inApp: true,
    };

    // Determine which channels to use
    const enabledChannels = channels || [
      DeliveryChannel.PUSH,
      DeliveryChannel.SMS,
      DeliveryChannel.EMAIL,
    ];

    // Create notification record
    const notification = await prisma.notification.create({
      data: {
        userId,
        projectId,
        type,
        title,
        message,
        channels: enabledChannels,
        status: NotificationStatus.PENDING,
      },
    });

    logger.info(`Created notification ${notification.id} for user ${userId}`);

    // Send via all channels in parallel
    const deliveryPromises: Promise<{
      channel: DeliveryChannel;
      success: boolean;
      error?: string;
    }>[] = [];

    // Push notification
    if (enabledChannels.includes(DeliveryChannel.PUSH) && prefs.push && user.fcmToken) {
      deliveryPromises.push(
        this.sendPush(notification.id, user.fcmToken, title, message, data)
      );
    }

    // SMS notification
    if (enabledChannels.includes(DeliveryChannel.SMS) && prefs.sms && user.phone) {
      deliveryPromises.push(
        this.sendSms(notification.id, user.phone, title, message, projectId)
      );
    }

    // Email notification
    if (enabledChannels.includes(DeliveryChannel.EMAIL) && prefs.email && user.email) {
      deliveryPromises.push(
        this.sendEmail(notification.id, user.email, title, message, projectId)
      );
    }

    // Wait for all deliveries
    const deliveryResults = await Promise.all(deliveryPromises);

    // Update notification status
    const allSuccess = deliveryResults.every((r) => r.success);
    const anySuccess = deliveryResults.some((r) => r.success);

    await prisma.notification.update({
      where: { id: notification.id },
      data: {
        status: allSuccess
          ? NotificationStatus.SENT
          : anySuccess
          ? NotificationStatus.SENT
          : NotificationStatus.FAILED,
        sentAt: anySuccess ? new Date() : null,
      },
    });

    logger.info(
      `Notification ${notification.id} sent: ${deliveryResults.filter((r) => r.success).length}/${deliveryResults.length} successful`
    );

    return {
      notificationId: notification.id,
      deliveryResults,
    };
  }

  /**
   * Send push notification and create delivery record
   */
  private async sendPush(
    notificationId: string,
    fcmToken: string,
    title: string,
    body: string,
    data?: { [key: string]: string }
  ): Promise<{ channel: DeliveryChannel; success: boolean; error?: string }> {
    try {
      const success = await pushService.sendPushNotification(fcmToken, title, body, data);

      await prisma.notificationDelivery.create({
        data: {
          notificationId,
          channel: DeliveryChannel.PUSH,
          status: success ? DeliveryStatus.SUCCESS : DeliveryStatus.FAILED,
          errorMessage: success ? null : 'Push notification failed',
          deliveredAt: success ? new Date() : null,
        },
      });

      return { channel: DeliveryChannel.PUSH, success };
    } catch (error: any) {
      logger.error('Push delivery error:', error);

      await prisma.notificationDelivery.create({
        data: {
          notificationId,
          channel: DeliveryChannel.PUSH,
          status: DeliveryStatus.FAILED,
          errorMessage: error.message,
        },
      });

      return { channel: DeliveryChannel.PUSH, success: false, error: error.message };
    }
  }

  /**
   * Send SMS and create delivery record
   */
  private async sendSms(
    notificationId: string,
    phone: string,
    title: string,
    message: string,
    projectId?: string
  ): Promise<{ channel: DeliveryChannel; success: boolean; error?: string }> {
    try {
      const success = await smsService.sendProjectNotification(phone, title, message);

      await prisma.notificationDelivery.create({
        data: {
          notificationId,
          channel: DeliveryChannel.SMS,
          status: success ? DeliveryStatus.SUCCESS : DeliveryStatus.FAILED,
          errorMessage: success ? null : 'SMS sending failed',
          deliveredAt: success ? new Date() : null,
        },
      });

      return { channel: DeliveryChannel.SMS, success };
    } catch (error: any) {
      logger.error('SMS delivery error:', error);

      await prisma.notificationDelivery.create({
        data: {
          notificationId,
          channel: DeliveryChannel.SMS,
          status: DeliveryStatus.FAILED,
          errorMessage: error.message,
        },
      });

      return { channel: DeliveryChannel.SMS, success: false, error: error.message };
    }
  }

  /**
   * Send email and create delivery record
   */
  private async sendEmail(
    notificationId: string,
    email: string,
    title: string,
    message: string,
    projectId?: string
  ): Promise<{ channel: DeliveryChannel; success: boolean; error?: string }> {
    try {
      const projectLink = projectId
        ? `${config.frontendUrl}/projects/${projectId}`
        : config.frontendUrl;

      const success = await emailService.sendProjectNotification(
        email,
        title,
        message,
        projectLink
      );

      await prisma.notificationDelivery.create({
        data: {
          notificationId,
          channel: DeliveryChannel.EMAIL,
          status: success ? DeliveryStatus.SUCCESS : DeliveryStatus.FAILED,
          errorMessage: success ? null : 'Email sending failed',
          deliveredAt: success ? new Date() : null,
        },
      });

      return { channel: DeliveryChannel.EMAIL, success };
    } catch (error: any) {
      logger.error('Email delivery error:', error);

      await prisma.notificationDelivery.create({
        data: {
          notificationId,
          channel: DeliveryChannel.EMAIL,
          status: DeliveryStatus.FAILED,
          errorMessage: error.message,
        },
      });

      return { channel: DeliveryChannel.EMAIL, success: false, error: error.message };
    }
  }

  /**
   * Notify all active users about a new project
   */
  async notifyProjectSubmitted(projectId: string, projectTitle: string, creatorName: string) {
    logger.info(`Sending PROJECT_SUBMITTED notifications for project ${projectId}`);

    // Get all active users except the creator
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        role: UserRole.USER,
        createdProjects: {
          none: { id: projectId },
        },
      },
      select: { id: true },
    });

    const notifications = users.map((user) =>
      this.sendNotification({
        userId: user.id,
        projectId,
        type: NotificationType.PROJECT_SUBMITTED,
        title: `New Project: ${projectTitle}`,
        message: `${creatorName} has submitted a new project for your review. Check it out and accept if you're interested!`,
        data: {
          projectId,
          action: 'view_project',
        },
      })
    );

    const results = await Promise.allSettled(notifications);
    const successful = results.filter((r) => r.status === 'fulfilled').length;

    logger.info(
      `PROJECT_SUBMITTED: Sent to ${successful}/${users.length} users for project ${projectId}`
    );
  }

  /**
   * Notify admin when a user accepts a project
   */
  async notifyProjectAccepted(
    projectId: string,
    projectTitle: string,
    userId: string,
    userName: string,
    creatorId: string
  ) {
    logger.info(`Sending PROJECT_ACCEPTED notification for project ${projectId}`);

    await this.sendNotification({
      userId: creatorId,
      projectId,
      type: NotificationType.PROJECT_ACCEPTED,
      title: `Project Accepted: ${projectTitle}`,
      message: `${userName} has accepted your project "${projectTitle}". View the project details to see all acceptances.`,
      data: {
        projectId,
        acceptedBy: userId,
        action: 'view_acceptances',
      },
    });
  }

  /**
   * Notify admin when project reaches required approvals
   */
  async notifyProjectApproved(projectId: string, projectTitle: string, creatorId: string) {
    logger.info(`Sending PROJECT_APPROVED notification for project ${projectId}`);

    await this.sendNotification({
      userId: creatorId,
      projectId,
      type: NotificationType.PROJECT_ACCEPTED, // Using same type as individual acceptances
      title: `Project Approved: ${projectTitle}`,
      message: `Great news! Your project "${projectTitle}" has received enough acceptances and is now approved. You can assign it to a user.`,
      data: {
        projectId,
        action: 'assign_project',
      },
    });
  }

  /**
   * Notify user when they are assigned a project
   */
  async notifyProjectAssigned(
    projectId: string,
    projectTitle: string,
    assignedUserId: string,
    assignedByName: string
  ) {
    logger.info(`Sending PROJECT_ASSIGNED notification for project ${projectId}`);

    await this.sendNotification({
      userId: assignedUserId,
      projectId,
      type: NotificationType.PROJECT_ASSIGNED,
      title: `Project Assigned: ${projectTitle}`,
      message: `Congratulations! ${assignedByName} has assigned the project "${projectTitle}" to you. Check the project details to get started.`,
      data: {
        projectId,
        action: 'view_assigned_project',
      },
    });
  }

  /**
   * Notify users who accepted but weren't assigned
   */
  async notifyProjectDeclined(
    projectId: string,
    projectTitle: string,
    declinedUserIds: string[]
  ) {
    logger.info(
      `Sending PROJECT_DECLINED notifications to ${declinedUserIds.length} users for project ${projectId}`
    );

    const notifications = declinedUserIds.map((userId) =>
      this.sendNotification({
        userId,
        projectId,
        type: NotificationType.PROJECT_DECLINED,
        title: `Project Update: ${projectTitle}`,
        message: `The project "${projectTitle}" has been assigned to another user. Thank you for your interest!`,
        data: {
          projectId,
          action: 'view_projects',
        },
      })
    );

    await Promise.allSettled(notifications);
  }

  /**
   * Notify relevant users when a project is deleted
   */
  async notifyProjectDeleted(
    projectId: string,
    projectTitle: string,
    affectedUserIds: string[]
  ) {
    logger.info(
      `Sending PROJECT_DELETED notifications to ${affectedUserIds.length} users for project ${projectId}`
    );

    const notifications = affectedUserIds.map((userId) =>
      this.sendNotification({
        userId,
        projectId,
        type: NotificationType.PROJECT_DELETED,
        title: `Project Deleted: ${projectTitle}`,
        message: `The project "${projectTitle}" has been deleted by the admin.`,
        data: {
          projectId,
          action: 'view_projects',
        },
      })
    );

    await Promise.allSettled(notifications);
  }

  /**
   * Send reminder for pending project approvals
   */
  async sendProjectReminder(projectId: string, projectTitle: string, userIds: string[]) {
    logger.info(
      `Sending REMINDER notifications to ${userIds.length} users for project ${projectId}`
    );

    const notifications = userIds.map((userId) =>
      this.sendNotification({
        userId,
        projectId,
        type: NotificationType.REMINDER,
        title: `Reminder: Review ${projectTitle}`,
        message: `Don't forget! The project "${projectTitle}" is still awaiting your review and approval.`,
        data: {
          projectId,
          action: 'review_project',
        },
      })
    );

    const results = await Promise.allSettled(notifications);
    const successful = results.filter((r) => r.status === 'fulfilled').length;

    logger.info(`REMINDER: Sent to ${successful}/${userIds.length} users for project ${projectId}`);

    // Update project reminder timestamp
    await prisma.project.update({
      where: { id: projectId },
      data: { reminderSentAt: new Date() },
    });
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(userId: string, limit: number = 50, offset: number = 0) {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        deliveries: {
          select: {
            channel: true,
            status: true,
            deliveredAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    return { notifications, unreadCount };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string) {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    logger.info(`Notification ${notificationId} marked as read by user ${userId}`);
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string) {
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    logger.info(`Marked ${result.count} notifications as read for user ${userId}`);
    return result.count;
  }

  /**
   * Delete old notifications (cleanup)
   */
  async cleanupOldNotifications(daysOld: number = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.notification.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        isRead: true,
      },
    });

    logger.info(`Deleted ${result.count} old notifications (older than ${daysOld} days)`);
    return result.count;
  }
}

export default new NotificationService();
