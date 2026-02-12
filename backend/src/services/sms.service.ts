import twilio from 'twilio';
import { config } from '../config';
import logger from '../utils/logger';
import { InternalServerError } from '../utils/errors';

class SmsService {
  private client: twilio.Twilio | null = null;

  constructor() {
    if (config.twilio.accountSid && config.twilio.authToken) {
      this.client = twilio(config.twilio.accountSid, config.twilio.authToken);
    } else {
      logger.warn('Twilio credentials not configured - SMS sending disabled');
    }
  }

  async sendSms(to: string, message: string): Promise<boolean> {
    if (!this.client) {
      logger.warn('SMS service not configured, skipping SMS send');
      return false;
    }

    try {
      // Format phone number
      const formattedPhone = to.startsWith('+') ? to : `+${to}`;

      const result = await this.client.messages.create({
        body: message,
        from: config.twilio.phoneNumber,
        to: formattedPhone,
      });

      logger.info(`SMS sent successfully to ${to}: ${result.sid}`);
      return true;
    } catch (error: any) {
      logger.error('Failed to send SMS:', error);

      // Don't throw error, just log it
      // This allows the app to continue even if SMS fails
      return false;
    }
  }

  async sendInvite(phone: string, inviteLink: string): Promise<boolean> {
    const message =
      `You've been invited to CetaProjectsManager!\n\n` +
      `Install the app and get started:\n${inviteLink}\n\n` +
      `This is a mobile-first app. Open the link on your phone for the best experience.`;

    return this.sendSms(phone, message);
  }

  async sendProjectNotification(
    phone: string,
    projectTitle: string,
    message: string
  ): Promise<boolean> {
    const smsMessage = `CetaProjectsManager:\n\n${projectTitle}\n\n${message}`;
    return this.sendSms(phone, smsMessage);
  }

  async sendReminder(phone: string, projectTitle: string): Promise<boolean> {
    const message =
      `Reminder: The project "${projectTitle}" still needs your approval.\n\n` +
      `Please review and accept if you're interested.\n\n` +
      `Login at: ${config.frontendUrl}`;

    return this.sendSms(phone, message);
  }
}

export default new SmsService();
