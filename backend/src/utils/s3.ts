import AWS from 'aws-sdk';
import { Readable } from 'stream';

// Configure AWS S3 client (works with both AWS S3 and MinIO)
const s3Client = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.AWS_ENDPOINT, // For MinIO: http://localhost:9000
  s3ForcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true', // Required for MinIO
  signatureVersion: 'v4',
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'community-dev-uploads';
const CLOUDFRONT_URL = process.env.CLOUDFRONT_URL;

export interface UploadOptions {
  buffer: Buffer;
  key: string;
  contentType: string;
  metadata?: Record<string, string>;
  isPublic?: boolean;
}

export interface UploadResult {
  key: string;
  url: string;
  bucket: string;
}

/**
 * Upload file to S3/MinIO
 */
export async function uploadFile(options: UploadOptions): Promise<UploadResult> {
  const { buffer, key, contentType, metadata, isPublic = false } = options;

  const params: AWS.S3.PutObjectRequest = {
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    Metadata: metadata || {},
    ...(isPublic && { ACL: 'public-read' }),
  };

  try {
    await s3Client.putObject(params).promise();

    // Generate URL (use CloudFront if available, otherwise direct S3)
    const url = CLOUDFRONT_URL
      ? `${CLOUDFRONT_URL}/${key}`
      : `${process.env.AWS_ENDPOINT || `https://s3.${process.env.AWS_REGION}.amazonaws.com`}/${BUCKET_NAME}/${key}`;

    return {
      key,
      url,
      bucket: BUCKET_NAME,
    };
  } catch (error: any) {
    console.error('S3 upload error:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
}

/**
 * Upload multiple files in parallel
 */
export async function uploadFiles(files: UploadOptions[]): Promise<UploadResult[]> {
  const uploads = files.map(file => uploadFile(file));
  return Promise.all(uploads);
}

/**
 * Download file from S3/MinIO
 */
export async function downloadFile(key: string): Promise<Buffer> {
  const params: AWS.S3.GetObjectRequest = {
    Bucket: BUCKET_NAME,
    Key: key,
  };

  try {
    const data = await s3Client.getObject(params).promise();

    if (!data.Body) {
      throw new Error('File body is empty');
    }

    return data.Body as Buffer;
  } catch (error: any) {
    console.error('S3 download error:', error);
    throw new Error(`Failed to download file: ${error.message}`);
  }
}

/**
 * Get signed URL for temporary access to private files
 */
export function getSignedUrl(key: string, expiresIn: number = 3600): string {
  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
    Expires: expiresIn, // seconds
  };

  try {
    return s3Client.getSignedUrl('getObject', params);
  } catch (error: any) {
    console.error('S3 signed URL error:', error);
    throw new Error(`Failed to generate signed URL: ${error.message}`);
  }
}

/**
 * Delete file from S3/MinIO
 */
export async function deleteFile(key: string): Promise<void> {
  const params: AWS.S3.DeleteObjectRequest = {
    Bucket: BUCKET_NAME,
    Key: key,
  };

  try {
    await s3Client.deleteObject(params).promise();
  } catch (error: any) {
    console.error('S3 delete error:', error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

/**
 * Delete multiple files in parallel
 */
export async function deleteFiles(keys: string[]): Promise<void> {
  const params: AWS.S3.DeleteObjectsRequest = {
    Bucket: BUCKET_NAME,
    Delete: {
      Objects: keys.map(key => ({ Key: key })),
    },
  };

  try {
    await s3Client.deleteObjects(params).promise();
  } catch (error: any) {
    console.error('S3 bulk delete error:', error);
    throw new Error(`Failed to delete files: ${error.message}`);
  }
}

/**
 * Check if file exists
 */
export async function fileExists(key: string): Promise<boolean> {
  const params: AWS.S3.HeadObjectRequest = {
    Bucket: BUCKET_NAME,
    Key: key,
  };

  try {
    await s3Client.headObject(params).promise();
    return true;
  } catch (error: any) {
    if (error.code === 'NotFound') {
      return false;
    }
    throw error;
  }
}

/**
 * Generate unique key for file uploads
 */
export function generateFileKey(
  folder: string,
  userId: string,
  filename: string
): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');

  return `${folder}/${userId}/${timestamp}-${randomString}-${sanitizedFilename}`;
}

/**
 * Validate file type
 */
export function isValidFileType(contentType: string, allowedTypes: string[]): boolean {
  return allowedTypes.some(type => {
    if (type.endsWith('/*')) {
      const prefix = type.slice(0, -2);
      return contentType.startsWith(prefix);
    }
    return contentType === type;
  });
}

/**
 * Validate file size
 */
export function isValidFileSize(size: number, maxSizeBytes: number): boolean {
  return size <= maxSizeBytes;
}

// Export configured client for advanced use cases
export { s3Client };
