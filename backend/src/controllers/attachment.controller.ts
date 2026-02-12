import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import storageService from '../services/storage.service';
import prisma from '../config/database';
import { ValidationError, NotFoundError, ForbiddenError } from '../utils/errors';
import { asyncHandler } from '../middleware/error.middleware';
import logger from '../utils/logger';

export class AttachmentController {
  uploadFile = asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    if (!req.file) {
      throw new ValidationError('No file uploaded');
    }

    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    // Check if storage is configured
    if (!storageService.isConfigured()) {
      throw new ValidationError(
        'File upload is not available. AWS S3 is not configured.'
      );
    }

    const { projectId } = req.body;

    // If projectId provided, verify it exists and user has access
    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new NotFoundError('Project not found');
      }

      // Only project creator can upload files
      if (project.createdById !== req.user.userId && req.user.role !== 'ADMIN') {
        throw new ForbiddenError('Only project creator can upload files');
      }
    }

    // Upload file to S3
    const uploadResult = await storageService.uploadFile(
      req.file,
      projectId ? `projects/${projectId}` : 'temp'
    );

    // Create attachment record in database
    const attachmentData: any = {
      filename: uploadResult.filename,
      originalFilename: uploadResult.originalFilename,
      fileType: uploadResult.fileType,
      fileSize: uploadResult.fileSize,
      storageUrl: uploadResult.key,
    };

    if (projectId) {
      attachmentData.projectId = projectId;
    }

    const attachment = await prisma.projectAttachment.create({
      data: attachmentData,
    });

    logger.info(
      `File uploaded: ${attachment.originalFilename} by user ${req.user.userId}`
    );

    res.status(201).json({
      status: 'success',
      data: {
        attachment: {
          id: attachment.id,
          filename: attachment.originalFilename,
          fileType: attachment.fileType,
          fileSize: attachment.fileSize,
          uploadedAt: attachment.uploadedAt,
        },
      },
    });
  });

  uploadMultipleFiles = asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      throw new ValidationError('No files uploaded');
    }

    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    // Check if storage is configured
    if (!storageService.isConfigured()) {
      throw new ValidationError(
        'File upload is not available. AWS S3 is not configured.'
      );
    }

    const { projectId } = req.body;

    // If projectId provided, verify it exists and user has access
    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new NotFoundError('Project not found');
      }

      if (project.createdById !== req.user.userId && req.user.role !== 'ADMIN') {
        throw new ForbiddenError('Only project creator can upload files');
      }
    }

    // Upload files to S3
    const uploadResults = await storageService.uploadMultipleFiles(
      req.files as Express.Multer.File[],
      projectId ? `projects/${projectId}` : 'temp'
    );

    // Create attachment records in database
    const attachments = await Promise.all(
      uploadResults.map((result) => {
        const attachmentData: any = {
          filename: result.filename,
          originalFilename: result.originalFilename,
          fileType: result.fileType,
          fileSize: result.fileSize,
          storageUrl: result.key,
        };

        if (projectId) {
          attachmentData.projectId = projectId;
        }

        return prisma.projectAttachment.create({
          data: attachmentData,
        });
      })
    );

    logger.info(
      `${attachments.length} files uploaded by user ${req.user.userId}`
    );

    res.status(201).json({
      status: 'success',
      data: {
        attachments: attachments.map((att) => ({
          id: att.id,
          filename: att.originalFilename,
          fileType: att.fileType,
          fileSize: att.fileSize,
          uploadedAt: att.uploadedAt,
        })),
        count: attachments.length,
      },
    });
  });

  getDownloadUrl = asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { attachmentId } = req.params;
    const expiresIn = req.query.expiresIn
      ? parseInt(req.query.expiresIn as string)
      : 3600;

    // Get attachment from database
    const attachment = await prisma.projectAttachment.findUnique({
      where: { id: attachmentId },
      include: {
        project: true,
      },
    });

    if (!attachment) {
      throw new NotFoundError('Attachment not found');
    }

    // Check access permissions
    if (attachment.project) {
      const isCreator = attachment.project.createdById === req.user.userId;
      const isAssignee = attachment.project.assignedToId === req.user.userId;
      const isAdmin = req.user.role === 'ADMIN';

      // Check if user has accepted the project
      const hasAccepted = await prisma.projectAcceptance.findFirst({
        where: {
          projectId: attachment.project.id,
          userId: req.user.userId,
        },
      });

      if (!isCreator && !isAssignee && !isAdmin && !hasAccepted) {
        throw new ForbiddenError('You do not have access to this file');
      }
    }

    // Generate signed download URL
    const downloadUrl = await storageService.getSignedDownloadUrl(
      attachment.storageUrl,
      expiresIn
    );

    res.status(200).json({
      status: 'success',
      data: {
        downloadUrl: downloadUrl.url,
        expiresIn: downloadUrl.expiresIn,
        filename: attachment.originalFilename,
        fileType: attachment.fileType,
        fileSize: attachment.fileSize,
      },
    });
  });

  deleteAttachment = asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { attachmentId } = req.params;

    // Get attachment from database
    const attachment = await prisma.projectAttachment.findUnique({
      where: { id: attachmentId },
      include: {
        project: true,
      },
    });

    if (!attachment) {
      throw new NotFoundError('Attachment not found');
    }

    // Check permissions - only creator or admin can delete
    if (attachment.project) {
      const isCreator = attachment.project.createdById === req.user.userId;
      const isAdmin = req.user.role === 'ADMIN';

      if (!isCreator && !isAdmin) {
        throw new ForbiddenError('Only project creator or admin can delete files');
      }
    }

    // Delete from S3
    await storageService.deleteFile(attachment.storageUrl);

    // Delete from database
    await prisma.projectAttachment.delete({
      where: { id: attachmentId },
    });

    logger.info(`Attachment deleted: ${attachmentId} by user ${req.user.userId}`);

    res.status(200).json({
      status: 'success',
      message: 'Attachment deleted successfully',
    });
  });

  listAttachments = asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { projectId } = req.query;

    const where: any = {};
    if (projectId) {
      where.projectId = projectId as string;

      // Verify user has access to project
      const project = await prisma.project.findUnique({
        where: { id: projectId as string },
      });

      if (!project) {
        throw new NotFoundError('Project not found');
      }

      const isCreator = project.createdById === req.user.userId;
      const isAssignee = project.assignedToId === req.user.userId;
      const isAdmin = req.user.role === 'ADMIN';

      const hasAccepted = await prisma.projectAcceptance.findFirst({
        where: {
          projectId: project.id,
          userId: req.user.userId,
        },
      });

      if (!isCreator && !isAssignee && !isAdmin && !hasAccepted) {
        throw new ForbiddenError('You do not have access to this project');
      }
    }

    const attachments = await prisma.projectAttachment.findMany({
      where,
      orderBy: { uploadedAt: 'desc' },
      select: {
        id: true,
        filename: true,
        originalFilename: true,
        fileType: true,
        fileSize: true,
        uploadedAt: true,
        projectId: true,
      },
    });

    res.status(200).json({
      status: 'success',
      data: {
        attachments,
        count: attachments.length,
      },
    });
  });

  getAttachmentInfo = asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { attachmentId } = req.params;

    const attachment = await prisma.projectAttachment.findUnique({
      where: { id: attachmentId },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!attachment) {
      throw new NotFoundError('Attachment not found');
    }

    // Check access permissions
    if (attachment.project) {
      const isCreator = attachment.project.createdBy.id === req.user.userId;
      const isAdmin = req.user.role === 'ADMIN';

      const hasAccepted = await prisma.projectAcceptance.findFirst({
        where: {
          projectId: attachment.project.id,
          userId: req.user.userId,
        },
      });

      if (!isCreator && !isAdmin && !hasAccepted) {
        throw new ForbiddenError('You do not have access to this file');
      }
    }

    res.status(200).json({
      status: 'success',
      data: { attachment },
    });
  });
}

export default new AttachmentController();
