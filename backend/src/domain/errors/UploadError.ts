/**
 * Base class for upload-related errors.
 */
export class UploadError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = 'UploadError';
  }
}

/**
 * Thrown when an uploaded file type is not allowed.
 */
export class InvalidFileTypeError extends UploadError {
  constructor(fileType: string, customMessage?: string) {
    const message = customMessage || `File type ${fileType} is not allowed`;
    super(message, 'INVALID_FILE_TYPE');
    this.name = 'InvalidFileTypeError';
  }
}

/**
 * Thrown when an uploaded file exceeds the maximum allowed size.
 */
export class FileTooLargeError extends UploadError {
  constructor(maxSizeMB: number, customMessage?: string) {
    const message = customMessage || `File size exceeds maximum allowed size of ${maxSizeMB} MB`;
    super(message, 'FILE_TOO_LARGE');
    this.name = 'FileTooLargeError';
  }
}

/**
 * Thrown when file upload to storage service fails.
 */
export class UploadFailedError extends UploadError {
  constructor(reason?: string) {
    const message = reason ? `File upload failed: ${reason}` : 'File upload failed';
    super(message, 'UPLOAD_FAILED');
    this.name = 'UploadFailedError';
  }
}
