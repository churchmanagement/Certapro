import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import projectService from '../services/project.service';
import { ValidationError } from '../utils/errors';
import { asyncHandler } from '../middleware/error.middleware';
import logger from '../utils/logger';
import { ProjectStatus } from '@prisma/client';

export class ProjectController {
  /**
   * Create a new project
   * POST /api/projects
   */
  createProject = asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    const project = await projectService.createProject({
      ...req.body,
      createdById: req.user!.userId,
    });

    logger.info(`Project created: ${project.id} by user ${req.user!.userId}`);

    res.status(201).json({
      status: 'success',
      data: { project },
    });
  });

  /**
   * Get all projects with filters
   * GET /api/projects
   */
  getAllProjects = asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    const filters = {
      status: req.query.status as ProjectStatus | undefined,
      createdById: req.query.createdById as string | undefined,
      assignedToId: req.query.assignedToId as string | undefined,
      includeDeleted: req.query.includeDeleted === 'true',
    };

    const projects = await projectService.getAllProjects(filters);

    res.status(200).json({
      status: 'success',
      data: { projects, count: projects.length },
    });
  });

  /**
   * Get project by ID
   * GET /api/projects/:projectId
   */
  getProjectById = asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    const includeDeleted = req.query.includeDeleted === 'true';
    const project = await projectService.getProjectById(req.params.projectId, includeDeleted);

    res.status(200).json({
      status: 'success',
      data: { project },
    });
  });

  /**
   * Update project
   * PUT /api/projects/:projectId
   */
  updateProject = asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    const project = await projectService.updateProject(
      req.params.projectId,
      req.body,
      req.user!.userId
    );

    logger.info(`Project updated: ${req.params.projectId} by user ${req.user!.userId}`);

    res.status(200).json({
      status: 'success',
      data: { project },
    });
  });

  /**
   * Delete project (soft delete)
   * DELETE /api/projects/:projectId
   */
  deleteProject = asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    await projectService.deleteProject(req.params.projectId, req.user!.userId);

    logger.info(`Project deleted: ${req.params.projectId} by user ${req.user!.userId}`);

    res.status(200).json({
      status: 'success',
      message: 'Project deleted successfully',
    });
  });

  /**
   * Accept a project
   * POST /api/projects/:projectId/accept
   */
  acceptProject = asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    const acceptance = await projectService.acceptProject({
      projectId: req.params.projectId,
      userId: req.user!.userId,
      notes: req.body.notes,
    });

    logger.info(`Project ${req.params.projectId} accepted by user ${req.user!.userId}`);

    res.status(201).json({
      status: 'success',
      data: { acceptance },
      message: 'Project accepted successfully',
    });
  });

  /**
   * Assign project to user (admin only)
   * POST /api/projects/:projectId/assign
   */
  assignProject = asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    const project = await projectService.assignProject(
      {
        projectId: req.params.projectId,
        assignedToId: req.body.assignedToId,
      },
      req.user!.userId
    );

    logger.info(
      `Project ${req.params.projectId} assigned to ${req.body.assignedToId} by admin ${req.user!.userId}`
    );

    res.status(200).json({
      status: 'success',
      data: { project },
      message: 'Project assigned successfully',
    });
  });

  /**
   * Get acceptances for a project
   * GET /api/projects/:projectId/acceptances
   */
  getProjectAcceptances = asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    const acceptances = await projectService.getProjectAcceptances(req.params.projectId);

    res.status(200).json({
      status: 'success',
      data: { acceptances, count: acceptances.length },
    });
  });

  /**
   * Get pending projects for current user
   * GET /api/projects/pending/me
   */
  getPendingProjects = asyncHandler(async (req: Request, res: Response) => {
    const projects = await projectService.getPendingProjectsForUser(req.user!.userId);

    res.status(200).json({
      status: 'success',
      data: { projects, count: projects.length },
    });
  });

  /**
   * Get projects assigned to current user
   * GET /api/projects/assigned/me
   */
  getMyAssignedProjects = asyncHandler(async (req: Request, res: Response) => {
    const projects = await projectService.getMyAssignedProjects(req.user!.userId);

    res.status(200).json({
      status: 'success',
      data: { projects, count: projects.length },
    });
  });

  /**
   * Get projects created by current user
   * GET /api/projects/created/me
   */
  getMyCreatedProjects = asyncHandler(async (req: Request, res: Response) => {
    const projects = await projectService.getMyCreatedProjects(req.user!.userId);

    res.status(200).json({
      status: 'success',
      data: { projects, count: projects.length },
    });
  });

  /**
   * Get project statistics (admin only)
   * GET /api/projects/stats
   */
  getProjectStats = asyncHandler(async (req: Request, res: Response) => {
    const stats = await projectService.getProjectStats();

    res.status(200).json({
      status: 'success',
      data: { stats },
    });
  });
}

export default new ProjectController();
