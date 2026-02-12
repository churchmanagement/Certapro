import { body, param } from 'express-validator';

export const createUserValidator = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('name')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters long'),
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Valid phone number is required'),
  body('role')
    .isIn(['ADMIN', 'USER'])
    .withMessage('Role must be either ADMIN or USER'),
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
];

export const updateUserValidator = [
  param('userId').isUUID().withMessage('Valid user ID is required'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters long'),
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Valid phone number is required'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];

export const userIdValidator = [
  param('userId').isUUID().withMessage('Valid user ID is required'),
];

export const inviteValidator = [
  body('emails')
    .optional()
    .isArray()
    .withMessage('Emails must be an array'),
  body('emails.*')
    .optional()
    .isEmail()
    .withMessage('Each email must be valid'),
  body('phones')
    .optional()
    .isArray()
    .withMessage('Phones must be an array'),
  body('phones.*')
    .optional()
    .isMobilePhone('any')
    .withMessage('Each phone number must be valid'),
];

export const fcmTokenValidator = [
  body('fcmToken')
    .optional({ nullable: true })
    .isString()
    .withMessage('FCM token must be a string'),
];

export const notificationPreferencesValidator = [
  body('push')
    .optional()
    .isBoolean()
    .withMessage('push must be a boolean'),
  body('sms')
    .optional()
    .isBoolean()
    .withMessage('sms must be a boolean'),
  body('email')
    .optional()
    .isBoolean()
    .withMessage('email must be a boolean'),
  body('inApp')
    .optional()
    .isBoolean()
    .withMessage('inApp must be a boolean'),
];
