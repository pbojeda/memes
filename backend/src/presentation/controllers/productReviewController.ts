import { Request, Response, NextFunction } from 'express';
import * as productReviewService from '../../application/services/productReviewService';
import { validateListReviewsInput } from '../../application/validators/productReviewValidator';
import {
  InvalidProductReviewDataError,
  ProductReviewNotFoundError,
} from '../../domain/errors/ProductReviewError';
import { ProductNotFoundError } from '../../domain/errors/ProductError';
import { success, created, noContent } from '../../utils/responseHelpers';

/**
 * Handle listing product reviews.
 * GET /api/products/:productId/reviews
 *
 * Public endpoint (no auth required).
 */
export async function listReviews(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const productId = req.params.productId as string;
    const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

    const validated = validateListReviewsInput({ page, limit });
    const result = await productReviewService.listProductReviews(productId, validated);

    // Custom JSON format with meta (not using paginated() helper)
    res.status(200).json({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    handleReviewError(error, res, next);
  }
}

/**
 * Handle creating a product review.
 * POST /api/products/:productId/reviews
 *
 * Requires authentication and MANAGER/ADMIN role.
 */
export async function createReview(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const productId = req.params.productId as string;
    const review = await productReviewService.createReview(productId, req.body);
    created(res, review);
  } catch (error) {
    handleReviewError(error, res, next);
  }
}

/**
 * Handle updating a product review.
 * PATCH /api/reviews/:reviewId
 *
 * Requires authentication and MANAGER/ADMIN role.
 */
export async function updateReview(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const reviewId = req.params.reviewId as string;
    const review = await productReviewService.updateReview(reviewId, req.body);
    success(res, review);
  } catch (error) {
    handleReviewError(error, res, next);
  }
}

/**
 * Handle deleting a product review.
 * DELETE /api/reviews/:reviewId
 *
 * Requires authentication and MANAGER/ADMIN role.
 */
export async function deleteReview(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const reviewId = req.params.reviewId as string;
    await productReviewService.deleteReview(reviewId);
    noContent(res);
  } catch (error) {
    handleReviewError(error, res, next);
  }
}

/**
 * Handle toggling review visibility.
 * PATCH /api/reviews/:reviewId/visibility
 *
 * Requires authentication and MANAGER/ADMIN role.
 */
export async function toggleVisibility(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const reviewId = req.params.reviewId as string;
    const review = await productReviewService.toggleReviewVisibility(reviewId, req.body);
    success(res, review);
  } catch (error) {
    handleReviewError(error, res, next);
  }
}

/**
 * Private helper to handle product review domain errors.
 * Maps domain errors to HTTP status codes.
 */
function handleReviewError(error: unknown, res: Response, next: NextFunction): void {
  if (error instanceof InvalidProductReviewDataError) {
    res.status(400).json({
      success: false,
      error: {
        message: error.message,
        code: error.code,
        field: error.field,
      },
    });
    return;
  }

  if (error instanceof ProductReviewNotFoundError || error instanceof ProductNotFoundError) {
    res.status(404).json({
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
