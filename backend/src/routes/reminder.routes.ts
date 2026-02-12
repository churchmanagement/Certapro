import { Router } from 'express';
import reminderController from '../controllers/reminder.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

// All routes require admin authentication
router.use(authenticate);
router.use(requireRole(['ADMIN']));

// Get reminder statistics
router.get('/stats', reminderController.getStats);

// Get projects needing reminder
router.get('/projects', reminderController.getProjectsNeedingReminder);

// Manually trigger reminder check
router.post('/trigger', reminderController.triggerReminders);

export default router;
