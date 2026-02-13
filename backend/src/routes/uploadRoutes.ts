import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { uploadImage } from '../presentation/controllers/uploadController';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import { upload } from '../middleware/multerConfig';
import { UserRole } from '../generated/prisma/enums';

const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '5', 10);

const router = Router();

/**
 * Handle multer-specific errors (file size, unexpected fields).
 * Must be a 4-arg function for Express to treat it as an error handler.
 */
function handleMulterError(err: Error, _req: Request, res: Response, next: NextFunction): void {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        success: false,
        error: {
          message: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE_MB} MB`,
          code: 'FILE_TOO_LARGE',
        },
      });
      return;
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      res.status(400).json({
        success: false,
        error: {
          message: 'Unexpected file field',
          code: 'INVALID_FILE_FIELD',
        },
      });
      return;
    }
  }
  next(err);
}

// POST /api/upload/image - Upload image file (MANAGER/ADMIN only)
router.post(
  '/image',
  authMiddleware,
  requireRole([UserRole.MANAGER, UserRole.ADMIN]),
  upload.single('file'),
  handleMulterError,
  uploadImage
);

export default router;
