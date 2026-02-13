import { Request, Response, NextFunction } from 'express';
import * as uploadService from '../../application/services/uploadService';
import { InvalidFileTypeError, FileTooLargeError, UploadFailedError } from '../../domain/errors/UploadError';
import { created } from '../../utils/responseHelpers';

/**
 * Handle file upload.
 * POST /api/upload/image
 *
 * Requires authentication and MANAGER/ADMIN role.
 */
export async function uploadImage(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Check if file was uploaded
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: {
          message: 'No file provided',
          code: 'NO_FILE',
        },
      });
      return;
    }

    // Extract optional folder from body
    const folder = req.body.folder;

    // Upload file
    const result = await uploadService.uploadFile(req.file, folder);

    // Return success
    created(res, result);
  } catch (error) {
    handleUploadError(error, res, next);
  }
}

/**
 * Private helper to handle upload domain errors.
 * Maps domain errors to HTTP status codes.
 */
function handleUploadError(error: unknown, res: Response, next: NextFunction): void {
  if (error instanceof InvalidFileTypeError || error instanceof FileTooLargeError) {
    res.status(400).json({
      success: false,
      error: {
        message: error.message,
        code: error.code,
      },
    });
    return;
  }

  if (error instanceof UploadFailedError) {
    res.status(500).json({
      success: false,
      error: {
        message: error.message,
        code: error.code,
      },
    });
    return;
  }

  // Unknown error - pass to global error handler
  next(error);
}
