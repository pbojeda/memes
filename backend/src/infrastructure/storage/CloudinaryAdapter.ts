import { Readable } from 'stream';
import cloudinary from './cloudinaryConfig';
import { StorageService, UploadOptions, UploadResult } from './StorageService';
import { UploadFailedError } from '../../domain/errors/UploadError';

/**
 * Cloudinary implementation of StorageService.
 * Uploads files to Cloudinary CDN.
 */
export class CloudinaryAdapter implements StorageService {
  /**
   * Uploads a file buffer to Cloudinary.
   * @param buffer - File content as Buffer
   * @param options - Upload options (folder, filename)
   * @returns Upload result with CDN URL and metadata
   * @throws {UploadFailedError} If upload fails
   */
  async upload(buffer: Buffer, options: UploadOptions): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const folder = options.folder || 'misc';
      const fullFolder = `memestore/${folder}`;

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: fullFolder,
          public_id: options.filename,
        },
        (error, result) => {
          if (error) {
            reject(new UploadFailedError(error.message));
            return;
          }

          if (!result) {
            reject(new UploadFailedError('No result from Cloudinary'));
            return;
          }

          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            size: result.bytes,
          });
        }
      );

      // Convert buffer to stream and pipe to Cloudinary
      const readableStream = new Readable({
        read() {
          this.push(buffer);
          this.push(null);
        },
      });

      readableStream.pipe(uploadStream);
    });
  }

  /**
   * Deletes a file from Cloudinary by its public ID.
   * Idempotent - does not throw if file not found.
   * @param publicId - Public identifier of the file
   * @throws {UploadFailedError} If delete fails for reasons other than not found
   */
  async delete(publicId: string): Promise<void> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);

      // 'not found' is OK (idempotent delete)
      if (result.result !== 'ok' && result.result !== 'not found') {
        throw new Error(`Unexpected result: ${result.result}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new UploadFailedError(`File delete failed: ${message}`);
    }
  }
}
