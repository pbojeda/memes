/**
 * Options for uploading a file to storage.
 */
export interface UploadOptions {
  folder?: string;
  filename?: string;
}

/**
 * Result returned from a successful file upload.
 */
export interface UploadResult {
  url: string;
  publicId: string;
  size: number;
}

/**
 * Storage service interface for file upload/deletion.
 * Abstracts the underlying storage provider (Cloudinary, S3, local, etc.)
 */
export interface StorageService {
  /**
   * Uploads a file buffer to storage.
   * @param buffer - File content as Buffer
   * @param options - Upload options (folder, filename)
   * @returns Upload result with CDN URL and metadata
   */
  upload(buffer: Buffer, options: UploadOptions): Promise<UploadResult>;

  /**
   * Deletes a file from storage by its public ID.
   * @param publicId - Public identifier of the file
   */
  delete(publicId: string): Promise<void>;
}
