import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import userService from '../services/user.service';
import { ValidationError } from '../utils/errors';
import { asyncHandler } from '../middleware/error.middleware';
import logger from '../utils/logger';

export class UserController {
  getAllUsers = asyncHandler(async (req: Request, res: Response) => {
    const includeInactive = req.query.includeInactive === 'true';
    const users = await userService.getAllUsers(includeInactive);

    res.status(200).json({
      status: 'success',
      data: { users, count: users.length },
    });
  });

  getUserById = asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    const user = await userService.getUserById(req.params.userId);

    res.status(200).json({
      status: 'success',
      data: { user },
    });
  });

  createUser = asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    const user = await userService.createUser(req.body);

    logger.info(`User created by admin: ${user.email}`);

    res.status(201).json({
      status: 'success',
      data: { user },
    });
  });

  updateUser = asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    const user = await userService.updateUser(req.params.userId, req.body);

    logger.info(`User updated: ${user.email}`);

    res.status(200).json({
      status: 'success',
      data: { user },
    });
  });

  deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    const result = await userService.deleteUser(req.params.userId);

    logger.info(`User deleted: ${req.params.userId}`);

    res.status(200).json({
      status: 'success',
      data: result,
    });
  });

  activateUser = asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    const result = await userService.activateUser(req.params.userId);

    logger.info(`User activated: ${req.params.userId}`);

    res.status(200).json({
      status: 'success',
      data: result,
    });
  });

  getUsersByRole = asyncHandler(async (req: Request, res: Response) => {
    const role = req.query.role as 'ADMIN' | 'USER';
    const activeOnly = req.query.activeOnly !== 'false';

    if (!role || !['ADMIN', 'USER'].includes(role)) {
      throw new ValidationError('Valid role is required (ADMIN or USER)');
    }

    const users = await userService.getUsersByRole(role, activeOnly);

    res.status(200).json({
      status: 'success',
      data: { users, count: users.length },
    });
  });

  updateFcmToken = asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { fcmToken } = req.body;
    const result = await userService.updateFcmToken(req.user.userId, fcmToken);

    res.status(200).json({
      status: 'success',
      data: result,
    });
  });

  updateNotificationPreferences = asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const result = await userService.updateNotificationPreferences(
      req.user.userId,
      req.body
    );

    res.status(200).json({
      status: 'success',
      data: result,
    });
  });

  sendInvitations = asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const result = await userService.sendInvitations(req.user.userId, req.body);

    logger.info(`Invitations sent by admin: ${req.user.email}`);

    res.status(200).json({
      status: 'success',
      data: result,
    });
  });

  getInvitations = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const invitations = await userService.getInvitations(req.user.userId);

    res.status(200).json({
      status: 'success',
      data: { invitations, count: invitations.length },
    });
  });
}

export default new UserController();
