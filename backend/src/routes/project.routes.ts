import { Router } from 'express';
import projectController from '../controllers/project.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import {
  createProjectValidator,
  updateProjectValidator,
  projectIdValidator,
  acceptProjectValidator,
  assignProjectValidator,
  getProjectsValidator,
} from '../validators/project.validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get project statistics (admin only)
router.get('/stats', requireRole(['ADMIN']), projectController.getProjectStats);

// Get pending projects for current user
router.get('/pending/me', projectController.getPendingProjects);

// Get projects assigned to current user
router.get('/assigned/me', projectController.getMyAssignedProjects);

// Get projects created by current user
router.get('/created/me', projectController.getMyCreatedProjects);

// Get all projects with filters
router.get('/', getProjectsValidator, projectController.getAllProjects);

// Create new project (admin only)
router.post('/', requireRole(['ADMIN']), createProjectValidator, projectController.createProject);

// Get project by ID
router.get('/:projectId', projectIdValidator, projectController.getProjectById);

// Update project
router.put('/:projectId', updateProjectValidator, projectController.updateProject);

// Delete project
router.delete('/:projectId', projectIdValidator, projectController.deleteProject);

// Accept project
router.post('/:projectId/accept', acceptProjectValidator, projectController.acceptProject);

// Assign project to user (admin only)
router.post(
  '/:projectId/assign',
  requireRole(['ADMIN']),
  assignProjectValidator,
  projectController.assignProject
);

// Get project acceptances
router.get('/:projectId/acceptances', projectIdValidator, projectController.getProjectAcceptances);

export default router;
