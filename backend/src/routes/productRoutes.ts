import { Router } from 'express';
import {
  getProductDetail,
  deleteProduct,
  restoreProduct,
} from '../presentation/controllers/productController';
import {
  listImages,
  addImage,
  updateImage,
  deleteImage,
} from '../presentation/controllers/productImageController';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import { UserRole } from '../generated/prisma/enums';

const router = Router();

// DELETE /api/products/:id - Soft delete product (MANAGER/ADMIN only)
router.delete(
  '/:id',
  authMiddleware,
  requireRole([UserRole.MANAGER, UserRole.ADMIN]),
  deleteProduct
);

// POST /api/products/:id/restore - Restore soft-deleted product (MANAGER/ADMIN only)
router.post(
  '/:id/restore',
  authMiddleware,
  requireRole([UserRole.MANAGER, UserRole.ADMIN]),
  restoreProduct
);

// GET /api/products/:slug - Get product detail (public, no auth)
router.get('/:slug', getProductDetail);

// Product Image routes
// GET /api/products/:productId/images - List product images (public, no auth)
router.get('/:productId/images', listImages);

// POST /api/products/:productId/images - Add product image (MANAGER/ADMIN only)
router.post(
  '/:productId/images',
  authMiddleware,
  requireRole([UserRole.MANAGER, UserRole.ADMIN]),
  addImage
);

// PATCH /api/products/:productId/images/:imageId - Update product image (MANAGER/ADMIN only)
router.patch(
  '/:productId/images/:imageId',
  authMiddleware,
  requireRole([UserRole.MANAGER, UserRole.ADMIN]),
  updateImage
);

// DELETE /api/products/:productId/images/:imageId - Delete product image (MANAGER/ADMIN only)
router.delete(
  '/:productId/images/:imageId',
  authMiddleware,
  requireRole([UserRole.MANAGER, UserRole.ADMIN]),
  deleteImage
);

export default router;
