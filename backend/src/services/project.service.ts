import prisma from '../config/database';
import { NotFoundError, ValidationError, ForbiddenError } from '../utils/errors';
import { ProjectStatus, UserRole, Prisma } from '@prisma/client';
import logger from '../utils/logger';
import notificationService from './notification.service';

export interface CreateProjectDto {
  title: string;
  description: string;
  proposedAmount: number;
  requiredApprovals: number;
  createdById: string;
}

export interface UpdateProjectDto {
  title?: string;
  description?: string;
  proposedAmount?: number;
  requiredApprovals?: number;
}

export interface AcceptProjectDto {
  userId: string;
  projectId: string;
  notes?: string;
}

export interface AssignProjectDto {
  projectId: string;
  assignedToId: string;
}

export interface ProjectFilters {
  status?: ProjectStatus;
  createdById?: string;
  assignedToId?: string;
  includeDeleted?: boolean;
}

export class ProjectService {
  /**
   * Create a new project
   */
  async createProject(data: CreateProjectDto) {
    const project = await prisma.project.create({
      data: {
        title: data.title,
        description: data.description,
        proposedAmount: data.proposedAmount,
        requiredApprovals: data.requiredApprovals,
        createdById: data.createdById,
        status: ProjectStatus.PENDING,
        currentApprovals: 0,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        attachments: true,
        _count: {
          select: {
            acceptances: true,
            attachments: true,
          },
        },
      },
    });

    logger.info(`Project created: ${project.id} by user ${data.createdById}`);

    // Notify all users about new project (async, don't wait)
    notificationService
      .notifyProjectSubmitted(project.id, project.title, project.createdBy.name)
      .catch((error) => logger.error('Failed to send project submitted notifications:', error));

    return project;
  }

  /**
   * Get all projects with optional filters
   */
  async getAllProjects(filters: ProjectFilters = {}) {
    const where: Prisma.ProjectWhereInput = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.createdById) {
      where.createdById = filters.createdById;
    }

    if (filters.assignedToId) {
      where.assignedToId = filters.assignedToId;
    }

    if (!filters.includeDeleted) {
      where.deletedAt = null;
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            acceptances: true,
            attachments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return projects;
  }

  /**
   * Get project by ID with full details
   */
  async getProjectById(projectId: string, includeDeleted: boolean = false) {
    const where: Prisma.ProjectWhereUniqueInput = { id: projectId };

    const project = await prisma.project.findUnique({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        attachments: {
          orderBy: { uploadedAt: 'desc' },
        },
        acceptances: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { acceptedAt: 'desc' },
        },
      },
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    if (project.deletedAt && !includeDeleted) {
      throw new NotFoundError('Project not found');
    }

    return project;
  }

  /**
   * Update project details
   */
  async updateProject(projectId: string, data: UpdateProjectDto, userId: string) {
    const project = await this.getProjectById(projectId);

    // Only creator or admin can update
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (project.createdById !== userId && user?.role !== UserRole.ADMIN) {
      throw new ForbiddenError('You do not have permission to update this project');
    }

    if (project.status === ProjectStatus.DELETED) {
      throw new ValidationError('Cannot update deleted project');
    }

    const updated = await prisma.project.update({
      where: { id: projectId },
      data,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            acceptances: true,
            attachments: true,
          },
        },
      },
    });

    logger.info(`Project updated: ${projectId} by user ${userId}`);
    return updated;
  }

  /**
   * Soft delete project
   */
  async deleteProject(projectId: string, userId: string) {
    const project = await this.getProjectById(projectId);

    // Only creator or admin can delete
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (project.createdById !== userId && user?.role !== UserRole.ADMIN) {
      throw new ForbiddenError('You do not have permission to delete this project');
    }

    if (project.deletedAt) {
      throw new ValidationError('Project is already deleted');
    }

    // Get users who accepted or were assigned
    const acceptances = await prisma.projectAcceptance.findMany({
      where: { projectId },
      select: { userId: true },
    });
    const affectedUserIds = acceptances.map((a) => a.userId);
    if (project.assignedTo) {
      affectedUserIds.push(project.assignedTo.id);
    }

    const deleted = await prisma.project.update({
      where: { id: projectId },
      data: {
        status: ProjectStatus.DELETED,
        deletedAt: new Date(),
      },
    });

    logger.info(`Project deleted: ${projectId} by user ${userId}`);

    // Notify affected users (async, don't block)
    if (affectedUserIds.length > 0) {
      notificationService
        .notifyProjectDeleted(projectId, project.title, affectedUserIds)
        .catch((error) => logger.error('Failed to send project deleted notifications:', error));
    }

    return deleted;
  }

  /**
   * User accepts a project
   */
  async acceptProject(data: AcceptProjectDto) {
    const { userId, projectId, notes } = data;

    const project = await this.getProjectById(projectId);

    if (project.status !== ProjectStatus.PENDING) {
      throw new ValidationError('Project is no longer accepting approvals');
    }

    // Check if user already accepted
    const existingAcceptance = await prisma.projectAcceptance.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    if (existingAcceptance) {
      throw new ValidationError('You have already accepted this project');
    }

    // Create acceptance and update project in transaction
    const result = await prisma.$transaction(async (tx) => {
      const acceptance = await tx.projectAcceptance.create({
        data: {
          projectId,
          userId,
          notes,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Update project approval count
      const updatedProject = await tx.project.update({
        where: { id: projectId },
        data: {
          currentApprovals: { increment: 1 },
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Check if enough approvals reached
      const isNowApproved =
        updatedProject.currentApprovals >= updatedProject.requiredApprovals;

      if (isNowApproved) {
        await tx.project.update({
          where: { id: projectId },
          data: { status: ProjectStatus.APPROVED },
        });
      }

      return { acceptance, updatedProject, isNowApproved };
    });

    logger.info(`Project ${projectId} accepted by user ${userId}`);

    // Notify project creator about acceptance
    notificationService
      .notifyProjectAccepted(
        projectId,
        project.title,
        userId,
        result.acceptance.user.name,
        project.createdById
      )
      .catch((error) => logger.error('Failed to send project accepted notification:', error));

    // If project just became approved, notify creator
    if (result.isNowApproved) {
      notificationService
        .notifyProjectApproved(projectId, project.title, project.createdById)
        .catch((error) => logger.error('Failed to send project approved notification:', error));
    }

    return result.acceptance;
  }

  /**
   * Admin assigns project to a user
   */
  async assignProject(data: AssignProjectDto, adminId: string) {
    const { projectId, assignedToId } = data;

    // Verify admin role
    const admin = await prisma.user.findUnique({ where: { id: adminId } });
    if (admin?.role !== UserRole.ADMIN) {
      throw new ForbiddenError('Only admins can assign projects');
    }

    const project = await this.getProjectById(projectId);

    if (project.status === ProjectStatus.DELETED) {
      throw new ValidationError('Cannot assign deleted project');
    }

    // Verify assigned user exists and is active
    const assignedUser = await prisma.user.findUnique({
      where: { id: assignedToId },
    });

    if (!assignedUser || !assignedUser.isActive) {
      throw new NotFoundError('Assigned user not found or inactive');
    }

    // Get users who accepted but weren't assigned
    const acceptances = await prisma.projectAcceptance.findMany({
      where: { projectId },
      select: { userId: true },
    });
    const declinedUserIds = acceptances
      .map((a) => a.userId)
      .filter((id) => id !== assignedToId);

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: {
        assignedToId,
        status: ProjectStatus.ASSIGNED,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    logger.info(`Project ${projectId} assigned to user ${assignedToId} by admin ${adminId}`);

    // Notify assigned user
    notificationService
      .notifyProjectAssigned(projectId, project.title, assignedToId, admin.name)
      .catch((error) => logger.error('Failed to send project assigned notification:', error));

    // Notify declined users (async, don't block)
    if (declinedUserIds.length > 0) {
      notificationService
        .notifyProjectDeclined(projectId, project.title, declinedUserIds)
        .catch((error) => logger.error('Failed to send project declined notifications:', error));
    }

    return updated;
  }

  /**
   * Get all acceptances for a project
   */
  async getProjectAcceptances(projectId: string) {
    await this.getProjectById(projectId); // Verify project exists

    const acceptances = await prisma.projectAcceptance.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { acceptedAt: 'desc' },
    });

    return acceptances;
  }

  /**
   * Get projects pending user's acceptance
   */
  async getPendingProjectsForUser(userId: string) {
    // Get projects user hasn't accepted yet
    const acceptedProjectIds = await prisma.projectAcceptance.findMany({
      where: { userId },
      select: { projectId: true },
    });

    const acceptedIds = acceptedProjectIds.map((a) => a.projectId);

    const projects = await prisma.project.findMany({
      where: {
        status: ProjectStatus.PENDING,
        deletedAt: null,
        id: { notIn: acceptedIds },
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            acceptances: true,
            attachments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return projects;
  }

  /**
   * Get projects assigned to user
   */
  async getMyAssignedProjects(userId: string) {
    const projects = await prisma.project.findMany({
      where: {
        assignedToId: userId,
        deletedAt: null,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        attachments: true,
        _count: {
          select: {
            acceptances: true,
            attachments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return projects;
  }

  /**
   * Get projects created by user
   */
  async getMyCreatedProjects(userId: string) {
    const projects = await prisma.project.findMany({
      where: {
        createdById: userId,
        deletedAt: null,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            acceptances: true,
            attachments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return projects;
  }

  /**
   * Get project statistics
   */
  async getProjectStats() {
    const [total, pending, approved, assigned, deleted] = await Promise.all([
      prisma.project.count({ where: { deletedAt: null } }),
      prisma.project.count({ where: { status: ProjectStatus.PENDING, deletedAt: null } }),
      prisma.project.count({ where: { status: ProjectStatus.APPROVED, deletedAt: null } }),
      prisma.project.count({ where: { status: ProjectStatus.ASSIGNED, deletedAt: null } }),
      prisma.project.count({ where: { status: ProjectStatus.DELETED } }),
    ]);

    return {
      total,
      byStatus: {
        pending,
        approved,
        assigned,
        deleted,
      },
    };
  }
}

export default new ProjectService();
