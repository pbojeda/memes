import { CloudinaryAdapter } from '../../infrastructure/storage/CloudinaryAdapter';
import { validateUploadFile, validateFolder } from '../validators/uploadValidator';

export interface UploadFileResult {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

/**
 * Uploads a file to cloud storage.
 * @param file - Express Multer file object
 * @param folder - Optional folder for organization
 * @returns Upload result with URL and metadata
 * @throws {InvalidFileTypeError} If file type is not allowed
 * @throws {FileTooLargeError} If file size exceeds limit
 * @throws {UploadFailedError} If upload fails
 */
export async function uploadFile(
  file: Express.Multer.File,
  folder?: string
): Promise<UploadFileResult> {
  // Validate file
  validateUploadFile(file);

  // Validate folder if provided
  const validatedFolder = validateFolder(folder, 'folder');

  // Upload to storage
  const storageService = new CloudinaryAdapter();
  const result = await storageService.upload(file.buffer, {
    folder: validatedFolder,
  });

  return {
    url: result.url,
    filename: result.publicId,
    size: result.size,
    mimeType: file.mimetype,
  };
}
