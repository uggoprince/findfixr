import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'node:stream';

interface CloudinaryUploadOptions {
  folder?: string;
  resource_type?: 'image' | 'video' | 'raw' | 'auto';
  public_id?: string;
  transformation?: any;
  format?: string;
  quality?: string | number;
}

@Injectable()
export class UploadService {
  constructor() {
    this.initializeCloudinary();
  }

  /**
   * Initialize Cloudinary with environment variables
   */
  private initializeCloudinary(): void {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error('Missing required Cloudinary environment variables');
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
  }

  /**
   * Upload a single file to Cloudinary
   * @param file - Express Multer file object
   * @param options - Cloudinary upload options (folder, resource_type, etc.)
   * @returns Promise<string> - Cloudinary secure URL
   */
  async uploadFile(file: Express.Multer.File, options?: CloudinaryUploadOptions): Promise<string> {
    if (!file || (!file.buffer && !file.stream)) {
      throw new BadRequestException('Invalid file provided');
    }

    const { originalname, buffer } = file;
    const filename = originalname || 'unknown';

    try {
      console.log('🟢 Starting Cloudinary upload');

      const uploadResult = await this.uploadToCloudinary(buffer, {
        folder: options?.folder || 'technician',
        resource_type: options?.resource_type || 'auto',
        public_id: options?.public_id || `${Date.now()}-${filename.split('.')[0]}`,
        format: options?.format,
        quality: options?.quality,
        transformation: options?.transformation,
      });

      const secureUrl: string = uploadResult.secure_url as string;
      if (!secureUrl) {
        throw new BadRequestException('Upload succeeded but no secure URL was returned');
      }

      console.log('🟢 Upload successful:', secureUrl);
      return secureUrl;
    } catch (error) {
      console.error('🔴 Cloudinary upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown upload error';
      throw new BadRequestException(`File upload failed: ${errorMessage}`);
    }
  }

  /**
   * Upload multiple files to Cloudinary
   * @param files - Array of Express Multer file objects
   * @param options - Cloudinary upload options
   * @returns Promise<string[]> - Array of Cloudinary secure URLs
   */
  async uploadMultipleFiles(files: Express.Multer.File[], options?: CloudinaryUploadOptions): Promise<string[]> {
    const uploadPromises = files.map((file) => this.uploadFile(file, options));
    return Promise.all(uploadPromises);
  }

  /**
   * Upload image with transformations
   * @param file - Express Multer file object
   * @param width - Image width
   * @param height - Image height
   * @param crop - Crop mode ('fill', 'fit', 'scale', etc.)
   * @returns Promise<string> - Cloudinary secure URL
   */
  async uploadImageWithTransformation(
    file: Express.Multer.File,
    width?: number,
    height?: number,
    crop: string = 'fill',
  ): Promise<string> {
    const transformation: any = { crop };

    if (width) transformation.width = width;
    if (height) transformation.height = height;

    return this.uploadFile(file, {
      folder: 'images',
      resource_type: 'image',
      transformation,
    });
  }

  /**
   * Upload video to Cloudinary
   * @param file - Express Multer file object
   * @param folder - Cloudinary folder name
   * @returns Promise<string> - Cloudinary secure URL
   */
  async uploadVideo(file: Express.Multer.File, folder: string = 'videos'): Promise<string> {
    return this.uploadFile(file, {
      folder,
      resource_type: 'video',
    });
  }

  /**
   * Delete file from Cloudinary
   * @param publicId - Cloudinary public ID
   * @param resourceType - Resource type ('image', 'video', 'raw')
   * @returns Promise<boolean> - True if deletion was successful
   */
  async deleteFile(publicId: string, resourceType: 'image' | 'video' | 'raw' = 'image'): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      });
      return result.result === 'ok';
    } catch (error) {
      console.error('🔴 Cloudinary deletion error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown deletion error';
      throw new BadRequestException(`File deletion failed: ${errorMessage}`);
    }
  }

  /**
   * Get file details from Cloudinary
   * @param publicId - Cloudinary public ID
   * @returns Promise<any> - Cloudinary resource details
   */
  async getFileDetails(publicId: string): Promise<any> {
    try {
      return await cloudinary.api.resource(publicId);
    } catch (error) {
      console.error('🔴 Cloudinary get details error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to get file details: ${errorMessage}`);
    }
  }

  /**
   * Core method to upload buffer to Cloudinary
   * @param buffer - File buffer
   * @param options - Cloudinary upload options
   * @returns Promise<UploadApiResponse>
   */
  private uploadToCloudinary(buffer: Buffer, options: CloudinaryUploadOptions): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
        if (error) {
          reject(new Error(error.message || 'Upload failed'));
        } else if (result) {
          resolve(result);
        } else {
          reject(new Error('Upload failed with no error or result'));
        }
      });

      // Convert buffer to readable stream and pipe to Cloudinary
      const readableStream = Readable.from(buffer);
      readableStream.pipe(uploadStream);
    });
  }

  /**
   * Validate file type against allowed types
   * @param mimetype - File MIME type
   * @param allowedTypes - Array of allowed MIME types
   * @returns boolean
   */
  validateFileType(mimetype: string, allowedTypes: string[]): boolean {
    return allowedTypes.includes(mimetype);
  }

  /**
   * Validate file against type and size constraints
   * @param file - Express Multer file object
   * @param allowedTypes - Array of allowed MIME types
   * @param maxSizeInBytes - Maximum file size in bytes
   * @returns Object with validation result
   */
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

  /**
   * Validate file size
   * @param file - Express Multer file object
   * @param maxSizeInBytes - Maximum file size in bytes
   * @returns boolean
   */
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
