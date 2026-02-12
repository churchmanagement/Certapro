import { body, param, query } from 'express-validator';

export const uploadFileValidator = [
  body('projectId')
    .optional()
    .isUUID()
    .withMessage('Valid project ID is required'),
];

export const attachmentIdValidator = [
  param('attachmentId')
    .isUUID()
    .withMessage('Valid attachment ID is required'),
];

export const downloadUrlValidator = [
  param('attachmentId')
    .isUUID()
    .withMessage('Valid attachment ID is required'),
  query('expiresIn')
    .optional()
    .isInt({ min: 60, max: 604800 })
    .withMessage('expiresIn must be between 60 seconds and 7 days'),
];

export const deleteAttachmentValidator = [
  param('attachmentId')
    .isUUID()
    .withMessage('Valid attachment ID is required'),
];

export const listAttachmentsValidator = [
  query('projectId')
    .optional()
    .isUUID()
    .withMessage('Valid project ID is required'),
];
