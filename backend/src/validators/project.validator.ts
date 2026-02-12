import { body, param, query } from 'express-validator';
import { ProjectStatus } from '@prisma/client';

export const createProjectValidator = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters'),
  body('proposedAmount')
    .isFloat({ min: 0 })
    .withMessage('Proposed amount must be a positive number'),
  body('requiredApprovals')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Required approvals must be between 1 and 10')
    .toInt(),
];

export const updateProjectValidator = [
  param('projectId')
    .isUUID()
    .withMessage('Invalid project ID'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters'),
  body('proposedAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Proposed amount must be a positive number'),
  body('requiredApprovals')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Required approvals must be between 1 and 10')
    .toInt(),
];

export const projectIdValidator = [
  param('projectId')
    .isUUID()
    .withMessage('Invalid project ID'),
];

export const acceptProjectValidator = [
  param('projectId')
    .isUUID()
    .withMessage('Invalid project ID'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters'),
];

export const assignProjectValidator = [
  param('projectId')
    .isUUID()
    .withMessage('Invalid project ID'),
  body('assignedToId')
    .notEmpty()
    .withMessage('Assigned user ID is required')
    .isUUID()
    .withMessage('Invalid user ID'),
];

export const getProjectsValidator = [
  query('status')
    .optional()
    .isIn(Object.values(ProjectStatus))
    .withMessage('Invalid project status'),
  query('createdById')
    .optional()
    .isUUID()
    .withMessage('Invalid creator ID'),
  query('assignedToId')
    .optional()
    .isUUID()
    .withMessage('Invalid assignee ID'),
  query('includeDeleted')
    .optional()
    .isBoolean()
    .withMessage('includeDeleted must be a boolean')
    .toBoolean(),
];
