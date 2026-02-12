import { param, query } from 'express-validator';

export const notificationIdValidator = [
  param('notificationId')
    .isUUID()
    .withMessage('Invalid notification ID'),
];

export const getNotificationsValidator = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer')
    .toInt(),
];

export const cleanupValidator = [
  query('daysOld')
    .optional()
    .isInt({ min: 30, max: 365 })
    .withMessage('Days old must be between 30 and 365')
    .toInt(),
];
