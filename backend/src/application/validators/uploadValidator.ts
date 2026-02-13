import { InvalidFileTypeError, FileTooLargeError } from '../../domain/errors/UploadError';

/**
 * Maximum file size in MB (from env or default).
 */
export const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '5', 10);

/**
 * Allowed MIME types (from env or default).
 */
export const ALLOWED_FILE_TYPES =
  process.env.ALLOWED_FILE_TYPES?.split(',') || ['image/jpeg', 'image/png', 'image/webp'];

const MAX_FOLDER_LENGTH = 50;
const FOLDER_REGEX = /^[a-zA-Z0-9-]+$/;

/**
 * Validates file MIME type against allowed types.
 * @param mimetype - File MIME type
 * @param fieldName - Field name for error messages
 * @throws {InvalidFileTypeError} If file type is not allowed
 */
export function validateFileType(mimetype: string, _fieldName: string): void {
  if (!mimetype || !ALLOWED_FILE_TYPES.includes(mimetype)) {
    throw new InvalidFileTypeError(mimetype);
  }
}

/**
 * Validates file size against maximum allowed size.
 * @param sizeInBytes - File size in bytes
 * @param fieldName - Field name for error messages
 * @throws {FileTooLargeError} If file size exceeds limit
 */
export function validateFileSize(sizeInBytes: number, _fieldName: string): void {
  if (sizeInBytes <= 0 || sizeInBytes > MAX_FILE_SIZE_MB * 1024 * 1024) {
    throw new FileTooLargeError(MAX_FILE_SIZE_MB);
  }
}

/**
 * Validates an uploaded file (type and size).
 * @param file - Express Multer file object
 * @throws {InvalidFileTypeError} If file type is not allowed
 * @throws {FileTooLargeError} If file size exceeds limit
 */
export function validateUploadFile(file: Express.Multer.File): void {
  validateFileType(file.mimetype, 'file');
  validateFileSize(file.size, 'file');
}

/**
 * Validates folder parameter.
 * @param folder - Folder name
 * @param fieldName - Field name for error messages
 * @returns Validated folder string or undefined
 * @throws {Error} If folder format is invalid
 */
export function validateFolder(folder: unknown, fieldName: string): string | undefined {
  if (folder === undefined || folder === null) {
    return undefined;
  }

  if (typeof folder !== 'string') {
    throw new Error(`${fieldName} must be a string`);
  }

  const trimmed = folder.trim();

  if (trimmed === '') {
    return undefined;
  }

  if (trimmed.length > MAX_FOLDER_LENGTH) {
    throw new Error(`${fieldName} exceeds ${MAX_FOLDER_LENGTH} characters`);
  }

  if (!FOLDER_REGEX.test(trimmed)) {
    throw new Error(`${fieldName} must contain only letters, numbers, and hyphens`);
  }

  return trimmed;
}
