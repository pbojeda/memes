import { Router } from 'express';
import {
  updateReview,
  deleteReview,
  toggleVisibility,
} from '../presentation/controllers/productReviewController';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import { UserRole } from '../generated/prisma/enums';

const router = Router();

// IMPORTANT: Route order matters - more specific routes BEFORE less specific ones

// PATCH /api/reviews/:reviewId/visibility - Toggle review visibility (MANAGER/ADMIN only)
// This MUST come BEFORE /:reviewId to avoid :reviewId matching "visibility"
router.patch(
  '/:reviewId/visibility',
  authMiddleware,
  requireRole([UserRole.MANAGER, UserRole.ADMIN]),
  toggleVisibility
);

// PATCH /api/reviews/:reviewId - Update review (MANAGER/ADMIN only)
router.patch(
  '/:reviewId',
  authMiddleware,
  requireRole([UserRole.MANAGER, UserRole.ADMIN]),
  updateReview
);

// DELETE /api/reviews/:reviewId - Delete review (MANAGER/ADMIN only)
router.delete(
  '/:reviewId',
  authMiddleware,
  requireRole([UserRole.MANAGER, UserRole.ADMIN]),
  deleteReview
);

export default router;
