import { Router } from 'express';
import {
  getProductDetail,
  deleteProduct,
  restoreProduct,
  createProduct,
  updateProduct,
  listProducts,
  activateProduct,
  deactivateProduct,
} from '../presentation/controllers/productController';
import {
  listImages,
  addImage,
  updateImage,
  deleteImage,
} from '../presentation/controllers/productImageController';
import { listReviews, createReview } from '../presentation/controllers/productReviewController';
import { authMiddleware } from '../middleware/authMiddleware';
import { optionalAuthMiddleware } from '../middleware/optionalAuthMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import { UserRole } from '../generated/prisma/enums';

const router = Router();

// Exact match routes (highest priority)
// GET /api/products - List products (public, optionalAuth for admin filters)
router.get('/', optionalAuthMiddleware, listProducts);

// POST /api/products - Create product (MANAGER/ADMIN only)
router.post('/', authMiddleware, requireRole([UserRole.MANAGER, UserRole.ADMIN]), createProduct);

// Multi-segment routes (higher specificity, no conflicts)
// POST /api/products/:id/activate - Activate product (MANAGER/ADMIN only)
router.post(
  '/:id/activate',
  authMiddleware,
  requireRole([UserRole.MANAGER, UserRole.ADMIN]),
  activateProduct
);

// POST /api/products/:id/deactivate - Deactivate product (MANAGER/ADMIN only)
router.post(
  '/:id/deactivate',
  authMiddleware,
  requireRole([UserRole.MANAGER, UserRole.ADMIN]),
  deactivateProduct
);

// POST /api/products/:id/restore - Restore soft-deleted product (MANAGER/ADMIN only)
router.post(
  '/:id/restore',
  authMiddleware,
  requireRole([UserRole.MANAGER, UserRole.ADMIN]),
  restoreProduct
);

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

// Product Review routes
// GET /api/products/:productId/reviews - List product reviews (public, no auth)
router.get('/:productId/reviews', listReviews);

// POST /api/products/:productId/reviews - Create product review (MANAGER/ADMIN only)
router.post(
  '/:productId/reviews',
  authMiddleware,
  requireRole([UserRole.MANAGER, UserRole.ADMIN]),
  createReview
);

// Single-segment routes (lower specificity)
// Note: GET /:id for admin is merged with GET /:slug
// The getProductDetail handler will check if parameter is UUID (admin ID access)
// or slug (public access) and route accordingly

// PATCH /api/products/:id - Update product (MANAGER/ADMIN only)
router.patch(
  '/:id',
  authMiddleware,
  requireRole([UserRole.MANAGER, UserRole.ADMIN]),
  updateProduct
);

// DELETE /api/products/:id - Soft delete product (MANAGER/ADMIN only)
router.delete(
  '/:id',
  authMiddleware,
  requireRole([UserRole.MANAGER, UserRole.ADMIN]),
  deleteProduct
);

// GET /api/products/:slug - Get product detail by slug (public, no auth)
// Also handles GET /api/products/:id for admin users (UUID format, includes soft-deleted)
// Uses optionalAuth to allow both public (slug) and admin (UUID) access
router.get('/:slug', optionalAuthMiddleware, getProductDetail);

export default router;
