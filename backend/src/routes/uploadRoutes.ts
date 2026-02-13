import { Router } from 'express';
import { uploadImage } from '../presentation/controllers/uploadController';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import { upload } from '../middleware/multerConfig';
import { UserRole } from '../generated/prisma/enums';

const router = Router();

// POST /api/upload/image - Upload image file (MANAGER/ADMIN only)
router.post(
  '/image',
  authMiddleware,
  requireRole([UserRole.MANAGER, UserRole.ADMIN]),
  upload.single('file'),
  uploadImage
);

export default router;
