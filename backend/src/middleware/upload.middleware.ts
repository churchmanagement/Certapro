import multer from 'multer';
import { Request } from 'express';
import { ValidationError } from '../utils/errors';
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from '../utils/file.utils';

// Use memory storage (files stored in memory as Buffer)
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Check if file type is allowed
  if (!ALLOWED_FILE_TYPES[file.mimetype as keyof typeof ALLOWED_FILE_TYPES]) {
    const allowedExtensions = Object.values(ALLOWED_FILE_TYPES).join(', ');
    return cb(
      new ValidationError(
        `Invalid file type: ${file.mimetype}. Allowed types: ${allowedExtensions}`
      )
    );
  }

  cb(null, true);
};

// Multer configuration
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 10, // Maximum 10 files per request
  },
});

// Middleware for single file upload
export const uploadSingle = (fieldName: string = 'file') => {
  return upload.single(fieldName);
};

// Middleware for multiple file upload
export const uploadMultiple = (fieldName: string = 'files', maxCount: number = 10) => {
  return upload.array(fieldName, maxCount);
};

// Middleware for handling multer errors
export const handleMulterError = (
  error: any,
  req: Request,
  res: any,
  next: any
) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return next(
        new ValidationError(
          `File size exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`
        )
      );
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return next(new ValidationError('Too many files uploaded'));
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return next(new ValidationError('Unexpected field in file upload'));
    }
    return next(new ValidationError(`Upload error: ${error.message}`));
  }

  next(error);
};
