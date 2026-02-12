import * as admin from 'firebase-admin';
import { config } from '../config';
import logger from '../utils/logger';

class PushService {
  private app: admin.app.App | null = null;

  constructor() {
    try {
      if (
        config.firebase.projectId &&
        config.firebase.privateKey &&
        config.firebase.clientEmail
      ) {
        this.app = admin.initializeApp({
          credential: admin.credential.cert({
            projectId: config.firebase.projectId,
            privateKey: config.firebase.privateKey,
            clientEmail: config.firebase.clientEmail,
          }),
        });
        logger.info('Firebase Admin SDK initialized successfully');
      } else {
        logger.warn('Firebase credentials not configured - push notifications disabled');
      }
    } catch (error) {
      logger.error('Failed to initialize Firebase Admin SDK:', error);
    }
  }

  async sendPushNotification(
    token: string,
    title: string,
    body: string,
    data?: { [key: string]: string }
  ): Promise<boolean> {
    if (!this.app) {
      logger.warn('Push service not configured, skipping push notification');
      return false;
    }

    try {
      const message: admin.messaging.Message = {
        notification: {
          title,
          body,
        },
        data: data || {},
        token,
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            priority: 'high',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
        webpush: {
          notification: {
            icon: '/icons/icon-192x192.png',
            badge: '/icons/badge-72x72.png',
            vibrate: [200, 100, 200],
          },
        },
      };

      const response = await admin.messaging().send(message);
      logger.info(`Push notification sent successfully: ${response}`);
      return true;
    } catch (error: any) {
      logger.error('Failed to send push notification:', error);

      // If token is invalid, return false so it can be removed
      if (error.code === 'messaging/invalid-registration-token' ||
          error.code === 'messaging/registration-token-not-registered') {
        logger.warn(`Invalid FCM token: ${token}`);
      }

      return false;
    }
  }

  async sendMulticastPushNotification(
    tokens: string[],
    title: string,
    body: string,
    data?: { [key: string]: string }
  ): Promise<{ successCount: number; failureCount: number; invalidTokens: string[] }> {
    if (!this.app || tokens.length === 0) {
      return { successCount: 0, failureCount: tokens.length, invalidTokens: [] };
    }

    try {
      const message: admin.messaging.MulticastMessage = {
        notification: {
          title,
          body,
        },
        data: data || {},
        tokens,
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            priority: 'high',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
        webpush: {
          notification: {
            icon: '/icons/icon-192x192.png',
            badge: '/icons/badge-72x72.png',
            vibrate: [200, 100, 200],
          },
        },
      };

      const response = await admin.messaging().sendEachForMulticast(message);

      // Collect invalid tokens
      const invalidTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success && resp.error) {
          const errorCode = resp.error.code;
          if (errorCode === 'messaging/invalid-registration-token' ||
              errorCode === 'messaging/registration-token-not-registered') {
            invalidTokens.push(tokens[idx]);
          }
        }
      });

      logger.info(`Multicast push sent: ${response.successCount} success, ${response.failureCount} failed`);

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
        invalidTokens,
      };
    } catch (error: any) {
      logger.error('Failed to send multicast push notification:', error);
      return { successCount: 0, failureCount: tokens.length, invalidTokens: [] };
    }
  }
}

export default new PushService();
