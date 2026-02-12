import nodemailer, { Transporter } from 'nodemailer';
import { config } from '../config';
import logger from '../utils/logger';

class EmailService {
  private transporter: Transporter | null = null;

  constructor() {
    if (config.email.host && config.email.user && config.email.password) {
      this.transporter = nodemailer.createTransport({
        host: config.email.host,
        port: config.email.port,
        secure: config.email.port === 465,
        auth: {
          user: config.email.user,
          pass: config.email.password,
        },
      });
    } else {
      logger.warn('Email credentials not configured - email sending disabled');
    }
  }

  async sendEmail(
    to: string,
    subject: string,
    html: string,
    text?: string
  ): Promise<boolean> {
    if (!this.transporter) {
      logger.warn('Email service not configured, skipping email send');
      return false;
    }

    try {
      const result = await this.transporter.sendMail({
        from: `"${config.email.fromName}" <${config.email.from}>`,
        to,
        subject,
        text: text || subject,
        html,
      });

      logger.info(`Email sent successfully to ${to}: ${result.messageId}`);
      return true;
    } catch (error: any) {
      logger.error('Failed to send email:', error);
      return false;
    }
  }

  async sendInvite(email: string, inviteLink: string): Promise<boolean> {
    const subject = 'You\'re Invited to CetaProjectsManager';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4F46E5; color: white; padding: 30px; text-align: center; }
          .content { background-color: #f9fafb; padding: 30px; }
          .button { display: inline-block; background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to CetaProjectsManager</h1>
          </div>
          <div class="content">
            <h2>You've Been Invited!</h2>
            <p>You've been invited to join CetaProjectsManager, a powerful project management platform.</p>
            <p>Click the button below to install the app and get started:</p>
            <p style="text-align: center;">
              <a href="${inviteLink}" class="button">Install App</a>
            </p>
            <p>Or copy this link: <br><strong>${inviteLink}</strong></p>
            <p><strong>Best on Mobile:</strong> This is a mobile-first Progressive Web App (PWA). For the best experience, open the link on your smartphone.</p>
          </div>
          <div class="footer">
            <p>CetaProjectsManager &copy; ${new Date().getFullYear()}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(email, subject, html);
  }

  async sendProjectNotification(
    email: string,
    projectTitle: string,
    message: string,
    projectLink: string
  ): Promise<boolean> {
    const subject = `New Project: ${projectTitle}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4F46E5; color: white; padding: 30px; text-align: center; }
          .content { background-color: #f9fafb; padding: 30px; }
          .project-title { color: #4F46E5; font-size: 24px; margin-bottom: 15px; }
          .button { display: inline-block; background-color: #10B981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>CetaProjectsManager</h1>
          </div>
          <div class="content">
            <h2 class="project-title">${projectTitle}</h2>
            <p>${message}</p>
            <p style="text-align: center;">
              <a href="${projectLink}" class="button">View Project</a>
            </p>
          </div>
          <div class="footer">
            <p>CetaProjectsManager &copy; ${new Date().getFullYear()}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(email, subject, html);
  }

  async sendReminder(
    email: string,
    projectTitle: string,
    projectLink: string
  ): Promise<boolean> {
    const subject = `Reminder: Review Project "${projectTitle}"`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #F59E0B; color: white; padding: 30px; text-align: center; }
          .content { background-color: #f9fafb; padding: 30px; }
          .button { display: inline-block; background-color: #F59E0B; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Project Reminder</h1>
          </div>
          <div class="content">
            <h2>Don't Forget!</h2>
            <p>The project <strong>"${projectTitle}"</strong> is still awaiting your review and approval.</p>
            <p>Please take a moment to review the project details and accept if you're interested.</p>
            <p style="text-align: center;">
              <a href="${projectLink}" class="button">Review Project</a>
            </p>
          </div>
          <div class="footer">
            <p>CetaProjectsManager &copy; ${new Date().getFullYear()}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(email, subject, html);
  }
}

export default new EmailService();
