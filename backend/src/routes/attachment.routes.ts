import { Router } from 'express';
import attachmentController from '../controllers/attachment.controller';
import { authenticate } from '../middleware/auth.middleware';
import { uploadSingle, uploadMultiple, handleMulterError } from '../middleware/upload.middleware';
import {
  uploadFileValidator,
  attachmentIdValidator,
  downloadUrlValidator,
  deleteAttachmentValidator,
  listAttachmentsValidator,
} from '../validators/attachment.validator';

const router = Router();

// All attachment routes require authentication
router.use(authenticate);

// Upload single file
router.post(
  '/upload',
  uploadSingle('file'),
  handleMulterError,
  uploadFileValidator,
  attachmentController.uploadFile
);

// Upload multiple files
router.post(
  '/upload-multiple',
  uploadMultiple('files', 10),
  handleMulterError,
  uploadFileValidator,
  attachmentController.uploadMultipleFiles
);

// Get download URL for an attachment
router.get(
  '/:attachmentId/download',
  downloadUrlValidator,
  attachmentController.getDownloadUrl
);

// Get attachment info
router.get(
  '/:attachmentId',
  attachmentIdValidator,
  attachmentController.getAttachmentInfo
);

// List attachments (optionally filtered by project)
router.get(
  '/',
  listAttachmentsValidator,
  attachmentController.listAttachments
);

// Delete attachment
router.delete(
  '/:attachmentId',
  deleteAttachmentValidator,
  attachmentController.deleteAttachment
);

export default router;
