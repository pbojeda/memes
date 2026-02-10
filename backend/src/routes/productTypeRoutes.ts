import { Router } from 'express';
import {
  listProductTypes,
  createProductType,
  updateProductType,
  deleteProductType,
} from '../presentation/controllers/productTypeController';
import { authMiddleware } from '../middleware/authMiddleware';
import { optionalAuthMiddleware } from '../middleware/optionalAuthMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import { UserRole } from '../generated/prisma/enums';

const router = Router();

// GET /api/product-types - List product types (public, role-aware)
router.get('/', optionalAuthMiddleware, listProductTypes);

// POST /api/product-types - Create product type (ADMIN only)
router.post('/', authMiddleware, requireRole(UserRole.ADMIN), createProductType);

// PATCH /api/product-types/:id - Update product type (ADMIN only)
router.patch('/:id', authMiddleware, requireRole(UserRole.ADMIN), updateProductType);

// DELETE /api/product-types/:id - Delete product type (ADMIN only)
router.delete('/:id', authMiddleware, requireRole(UserRole.ADMIN), deleteProductType);

export default router;
