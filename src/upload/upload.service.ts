import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage'; // Import Upload instead of PutObjectCommand
import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class UploadService {
  private readonly s3 = this.initializeS3Client();

  async uploadFile(file: Express.Multer.File): Promise<string> {
    if (!file || (!file.buffer && !file.stream)) {
      throw new BadRequestException('Invalid file provided');
    }

    // Use originalname instead of filename (which doesn't exist on Express.Multer.File)
    const { originalname, mimetype, buffer, stream } = file;
    const filename = originalname || 'unknown';

    try {
      // Use Upload from @aws-sdk/lib-storage to handle streams properly
      const upload = new Upload({
        client: this.s3,
        params: {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: `technician/${Date.now()}-${filename}`,
          Body: buffer || stream, // Use buffer first, fallback to stream
          ContentType: mimetype,
          // Remove ACL - your bucket doesn't support ACLs
          // ACL: 'public-read',
        },
      });

      console.log('🟢 Starting file upload');
      const uploadResult = await upload.done();

      console.log('🟢 Upload successful:', uploadResult.Location);

      if (!uploadResult.Location) {
        throw new BadRequestException('Upload succeeded but no file location was returned.');
      }
      return uploadResult.Location;
    } catch (error) {
      console.error('🔴 S3 upload error:', error);
      if (error.name === 'AccessControlListNotSupported') {
        throw new BadRequestException('S3 bucket does not support ACLs. Contact administrator.');
      }
      throw new BadRequestException(`File upload failed: ${error.message}`);
    }
  }

  private initializeS3Client(): S3Client {
    const region = process.env.AWS_REGION || 'us-east-1';
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID!;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY!;

    if (!region || !accessKeyId || !secretAccessKey) {
      throw new Error('Missing required AWS environment variables');
    }

    return new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async uploadMultipleFiles(files: Express.Multer.File[]): Promise<string[]> {
    const uploadPromises = files.map((file) => this.uploadFile(file));
    return Promise.all(uploadPromises);
  }

  validateFileType(mimetype: string, allowedTypes: string[]): boolean {
    return allowedTypes.includes(mimetype);
  }

  validateFile(
    file: Express.Multer.File,
    allowedTypes: string[],
    maxSizeInBytes: number,
  ): { isValid: boolean; error?: string } {
    if (!this.validateFileType(file.mimetype, allowedTypes)) {
      return { isValid: false, error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}` };
    }

    const isSizeValid = this.validateFileSize(file, maxSizeInBytes);
    if (!isSizeValid) {
      return { isValid: false, error: `File size exceeds limit of ${Math.round(maxSizeInBytes / 1024 / 1024)}MB` };
    }

    return { isValid: true };
  }

  // Simple synchronous file size validation (no stream handling)
  validateFileSize(file: Express.Multer.File, maxSizeInBytes: number): boolean {
    // Check file.size property first
    if (file.size) {
      return file.size <= maxSizeInBytes;
    }

    // Check buffer length
    if (file.buffer) {
      return file.buffer.length <= maxSizeInBytes;
    }

    // If neither size nor buffer is available, reject
    console.warn('⚠️ Cannot determine file size - no size or buffer property');
    return false;
  }
}
