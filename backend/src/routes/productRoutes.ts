import { Router } from 'express';
import {
  getProductDetail,
  deleteProduct,
  restoreProduct,
} from '../presentation/controllers/productController';
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

export default router;
