import { Router } from 'express';
import authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import {
  registerValidator,
  loginValidator,
  refreshTokenValidator,
  updatePasswordValidator,
} from '../validators/auth.validator';

const router = Router();

// Public routes
router.post('/register', registerValidator, authController.register);
router.post('/login', loginValidator, authController.login);
router.post('/refresh', refreshTokenValidator, authController.refreshToken);

// Protected routes
router.get('/me', authenticate, authController.getCurrentUser);
router.put('/password', authenticate, updatePasswordValidator, authController.updatePassword);
router.post('/logout', authenticate, authController.logout);

// OAuth routes (to be implemented with Passport.js)
// router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
// router.get('/google/callback', passport.authenticate('google', { session: false }), authController.googleCallback);

export default router;
