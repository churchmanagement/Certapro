import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ValidationError } from './errors';

export const ALLOWED_FILE_TYPES = {
  // Documents
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',

  // Images
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',

  // Compressed
  'application/zip': '.zip',
  'application/x-rar-compressed': '.rar',
};

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateFileType = (mimetype: string): FileValidationResult => {
  if (!ALLOWED_FILE_TYPES[mimetype as keyof typeof ALLOWED_FILE_TYPES]) {
    return {
      isValid: false,
      error: `File type not allowed. Allowed types: ${Object.values(ALLOWED_FILE_TYPES).join(', ')}`,
    };
  }

  return { isValid: true };
};

export const validateFileSize = (size: number): FileValidationResult => {
  if (size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  return { isValid: true };
};

export const validateFile = (
  file: Express.Multer.File
): FileValidationResult => {
  // Check file type
  const typeValidation = validateFileType(file.mimetype);
  if (!typeValidation.isValid) {
    return typeValidation;
  }

  // Check file size
  const sizeValidation = validateFileSize(file.size);
  if (!sizeValidation.isValid) {
    return sizeValidation;
  }

  return { isValid: true };
};

export const generateUniqueFileName = (originalName: string): string => {
  const ext = path.extname(originalName);
  const nameWithoutExt = path.basename(originalName, ext);
  const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');
  const uniqueId = uuidv4();
  const timestamp = Date.now();

  return `${timestamp}-${uniqueId}-${sanitizedName}${ext}`;
};

export const getFileExtension = (filename: string): string => {
  return path.extname(filename).toLowerCase();
};

export const sanitizeFileName = (filename: string): string => {
  // Remove special characters and spaces
  return filename.replace(/[^a-zA-Z0-9.-]/g, '_');
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

export const getContentType = (filename: string): string => {
  const ext = getFileExtension(filename);
  const mimeTypes: { [key: string]: string } = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.zip': 'application/zip',
    '.rar': 'application/x-rar-compressed',
  };

  return mimeTypes[ext] || 'application/octet-stream';
};
