import AWS from 'aws-sdk';
import { config } from './index';
import logger from '../utils/logger';

class StorageConfig {
  public s3: AWS.S3 | null = null;
  private initialized: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    if (this.initialized) {
      return;
    }

    if (!config.aws.accessKeyId || !config.aws.secretAccessKey || !config.aws.s3Bucket) {
      logger.warn(
        'AWS S3 credentials not configured - file upload will be disabled. ' +
        'Add AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_S3_BUCKET to .env'
      );
      return;
    }

    try {
      this.s3 = new AWS.S3({
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
        region: config.aws.region,
        signatureVersion: 'v4',
      });

      this.initialized = true;
      logger.info('✅ AWS S3 initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize AWS S3:', error);
    }
  }

  public isConfigured(): boolean {
    return this.s3 !== null;
  }

  public getBucketName(): string {
    return config.aws.s3Bucket;
  }

  public getRegion(): string {
    return config.aws.region;
  }
}

export default new StorageConfig();
