import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import authService from '../services/auth.service';
import { ValidationError } from '../utils/errors';
import { asyncHandler } from '../middleware/error.middleware';
import logger from '../utils/logger';
import prisma from '../config/database';

export class AuthController {
  register = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    const { user, tokens } = await authService.register(req.body);

    logger.info(`User registered: ${user.email}`);

    res.status(201).json({
      status: 'success',
      data: { user, tokens },
    });
  });

  login = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    const { user, tokens } = await authService.login(req.body);

    logger.info(`User logged in: ${user.email}`);

    res.status(200).json({
      status: 'success',
      data: { user, tokens },
    });
  });

  refreshToken = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    const { refreshToken } = req.body;
    const tokens = await authService.refreshToken(refreshToken);

    res.status(200).json({
      status: 'success',
      data: { tokens },
    });
  });

  getCurrentUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const user = await authService.getCurrentUser(req.user.userId);

    res.status(200).json({
      status: 'success',
      data: { user },
    });
  });

  updatePassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { currentPassword, newPassword } = req.body;
    const result = await authService.updatePassword(
      req.user.userId,
      currentPassword,
      newPassword
    );

    res.status(200).json({
      status: 'success',
      data: result,
    });
  });

  logout = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    // Clear FCM token if provided
    if (req.user && req.body.fcmToken) {
      await prisma.user.update({
        where: { id: req.user.userId },
        data: { fcmToken: null },
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully',
    });
  });
}

export default new AuthController();
