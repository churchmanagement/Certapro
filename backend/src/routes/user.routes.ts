import { Router } from 'express';
import userController from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/role.middleware';
import {
  createUserValidator,
  updateUserValidator,
  userIdValidator,
  inviteValidator,
  fcmTokenValidator,
  notificationPreferencesValidator,
} from '../validators/user.validator';

const router = Router();

// All user routes require authentication
router.use(authenticate);

// User profile routes (any authenticated user)
router.put('/fcm-token', fcmTokenValidator, userController.updateFcmToken);
router.put(
  '/notification-preferences',
  notificationPreferencesValidator,
  userController.updateNotificationPreferences
);

// Admin-only routes
router.get('/', requireAdmin, userController.getAllUsers);
router.get('/by-role', requireAdmin, userController.getUsersByRole);
router.get('/:userId', requireAdmin, userIdValidator, userController.getUserById);
router.post('/', requireAdmin, createUserValidator, userController.createUser);
router.put('/:userId', requireAdmin, updateUserValidator, userController.updateUser);
router.delete('/:userId', requireAdmin, userIdValidator, userController.deleteUser);
router.post('/:userId/activate', requireAdmin, userIdValidator, userController.activateUser);

// Invitation routes (admin only)
router.post('/invitations/send', requireAdmin, inviteValidator, userController.sendInvitations);
router.get('/invitations', requireAdmin, userController.getInvitations);

export default router;
