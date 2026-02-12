import storageConfig from '../config/storage';
import {
  generateUniqueFileName,
  validateFile,
  formatFileSize,
} from '../utils/file.utils';
import { InternalServerError, ValidationError } from '../utils/errors';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export interface UploadResult {
  key: string;
  url: string;
  filename: string;
  originalFilename: string;
  fileType: string;
  fileSize: number;
}

export interface DownloadUrlResult {
  url: string;
  expiresIn: number;
}

class StorageService {
  private ensureConfigured() {
    if (!storageConfig.isConfigured()) {
      throw new InternalServerError(
        'File storage is not configured. Please set up AWS S3 credentials.'
      );
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'attachments'
  ): Promise<UploadResult> {
    this.ensureConfigured();

    // Validate file
    const validation = validateFile(file);
    if (!validation.isValid) {
      throw new ValidationError(validation.error || 'Invalid file');
    }

    const filename = generateUniqueFileName(file.originalname);
    const key = `${folder}/${filename}`;

    try {
      const params = {
        Bucket: storageConfig.getBucketName(),
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ServerSideEncryption: 'AES256',
        Metadata: {
          originalname: file.originalname,
          uploadedAt: new Date().toISOString(),
        },
      };

      await storageConfig.s3!.putObject(params).promise();

      logger.info(
        `File uploaded successfully: ${key} (${formatFileSize(file.size)})`
      );

      return {
        key,
        url: this.getPublicUrl(key),
        filename,
        originalFilename: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
      };
    } catch (error: any) {
      logger.error('Failed to upload file to S3:', error);
      throw new InternalServerError(
        `Failed to upload file: ${error.message}`
      );
    }
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[],
    folder: string = 'attachments'
  ): Promise<UploadResult[]> {
    this.ensureConfigured();

    const uploadPromises = files.map((file) =>
      this.uploadFile(file, folder)
    );

    try {
      const results = await Promise.all(uploadPromises);
      logger.info(`${results.length} files uploaded successfully`);
      return results;
    } catch (error: any) {
      logger.error('Failed to upload multiple files:', error);
      throw new InternalServerError(
        `Failed to upload files: ${error.message}`
      );
    }
  }

  async getSignedDownloadUrl(
    key: string,
    expiresIn: number = 3600
  ): Promise<DownloadUrlResult> {
    this.ensureConfigured();

    try {
      const params = {
        Bucket: storageConfig.getBucketName(),
        Key: key,
        Expires: expiresIn,
      };

      const url = await storageConfig.s3!.getSignedUrlPromise(
        'getObject',
        params
      );

      return {
        url,
        expiresIn,
      };
    } catch (error: any) {
      logger.error('Failed to generate signed URL:', error);
      throw new InternalServerError(
        `Failed to generate download URL: ${error.message}`
      );
    }
  }

  async deleteFile(key: string): Promise<void> {
    this.ensureConfigured();

    try {
      const params = {
        Bucket: storageConfig.getBucketName(),
        Key: key,
      };

      await storageConfig.s3!.deleteObject(params).promise();

      logger.info(`File deleted successfully: ${key}`);
    } catch (error: any) {
      logger.error('Failed to delete file from S3:', error);
      throw new InternalServerError(
        `Failed to delete file: ${error.message}`
      );
    }
  }

  async deleteMultipleFiles(keys: string[]): Promise<void> {
    this.ensureConfigured();

    if (keys.length === 0) {
      return;
    }

    try {
      const params = {
        Bucket: storageConfig.getBucketName(),
        Delete: {
          Objects: keys.map((key) => ({ Key: key })),
          Quiet: false,
        },
      };

      const result = await storageConfig.s3!.deleteObjects(params).promise();

      logger.info(
        `${result.Deleted?.length || 0} files deleted successfully`
      );

      if (result.Errors && result.Errors.length > 0) {
        logger.error('Some files failed to delete:', result.Errors);
      }
    } catch (error: any) {
      logger.error('Failed to delete multiple files from S3:', error);
      throw new InternalServerError(
        `Failed to delete files: ${error.message}`
      );
    }
  }

  async fileExists(key: string): Promise<boolean> {
    this.ensureConfigured();

    try {
      const params = {
        Bucket: storageConfig.getBucketName(),
        Key: key,
      };

      await storageConfig.s3!.headObject(params).promise();
      return true;
    } catch (error: any) {
      if (error.code === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  async getFileMetadata(key: string): Promise<any> {
    this.ensureConfigured();

    try {
      const params = {
        Bucket: storageConfig.getBucketName(),
        Key: key,
      };

      const metadata = await storageConfig.s3!.headObject(params).promise();
      return {
        size: metadata.ContentLength,
        contentType: metadata.ContentType,
        lastModified: metadata.LastModified,
        metadata: metadata.Metadata,
      };
    } catch (error: any) {
      logger.error('Failed to get file metadata:', error);
      throw new InternalServerError(
        `Failed to get file metadata: ${error.message}`
      );
    }
  }

  private getPublicUrl(key: string): string {
    const bucket = storageConfig.getBucketName();
    const region = storageConfig.getRegion();
    return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
  }

  isConfigured(): boolean {
    return storageConfig.isConfigured();
  }
}

export default new StorageService();
