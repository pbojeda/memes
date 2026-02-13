import prisma from '../../lib/prisma';
import {
  validateCreateReviewInput,
  validateUpdateReviewInput,
  validateToggleVisibilityInput,
  type ValidatedCreateReviewInput,
  type ValidatedUpdateReviewInput,
  type ValidatedToggleVisibilityInput,
  type ValidatedListReviewsInput,
} from '../validators/productReviewValidator';
import { validateUUID } from '../validators/shared';
import {
  ProductReviewNotFoundError,
  InvalidProductReviewDataError,
} from '../../domain/errors/ProductReviewError';
import { ProductNotFoundError } from '../../domain/errors/ProductError';
import type { ProductReview } from '../../generated/prisma/client';

export interface ReviewListResult {
  data: ProductReview[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    averageRating: number;
    ratingDistribution: {
      1: number;
      2: number;
      3: number;
      4: number;
      5: number;
    };
  };
}

/**
 * Lists visible reviews for a product with pagination and analytics.
 * Analytics (average rating, distribution) are calculated from ALL reviews (not just visible).
 * @param productId - Product UUID
 * @param input - Pagination parameters
 * @returns Paginated visible reviews with analytics
 * @throws {InvalidProductReviewDataError} If productId is invalid
 */
export async function listProductReviews(
  productId: string,
  input: ValidatedListReviewsInput
): Promise<ReviewListResult> {
  function throwError(message: string, field: string): never {
    throw new InvalidProductReviewDataError(message, field);
  }

  validateUUID(productId, 'productId', throwError);

  const skip = (input.page - 1) * input.limit;

  // Fetch visible reviews only
  const data = await prisma.productReview.findMany({
    where: { productId, isVisible: true },
    orderBy: { createdAt: 'desc' },
    skip,
    take: input.limit,
  });

  // Count visible reviews
  const total = await prisma.productReview.count({
    where: { productId, isVisible: true },
  });

  // Calculate analytics from ALL reviews (visible + hidden)
  const avgResult = await prisma.productReview.aggregate({
    where: { productId },
    _avg: { rating: true },
  });

  const distributionResult = await prisma.productReview.groupBy({
    by: ['rating'],
    where: { productId },
    _count: { rating: true },
  });

  // Build rating distribution (1-5, all initialized to 0)
  const ratingDistribution: { 1: number; 2: number; 3: number; 4: number; 5: number } = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  distributionResult.forEach((item) => {
    if (item.rating >= 1 && item.rating <= 5) {
      ratingDistribution[item.rating as 1 | 2 | 3 | 4 | 5] = item._count.rating;
    }
  });

  // Default averageRating to 0 when null (no reviews)
  const averageRating = avgResult._avg.rating
    ? Math.round(avgResult._avg.rating * 100) / 100
    : 0;

  const totalPages = Math.ceil(total / input.limit);

  return {
    data,
    meta: {
      page: input.page,
      limit: input.limit,
      total,
      totalPages,
      averageRating,
      ratingDistribution,
    },
  };
}

/**
 * Creates a new review for a product.
 * Validates that the product exists and is not soft-deleted.
 * @param productId - Product UUID
 * @param input - Review data
 * @returns Created review
 * @throws {InvalidProductReviewDataError} If validation fails
 * @throws {ProductNotFoundError} If product not found or soft-deleted
 */
export async function createReview(
  productId: string,
  input: ValidatedCreateReviewInput
): Promise<ProductReview> {
  function throwError(message: string, field: string): never {
    throw new InvalidProductReviewDataError(message, field);
  }

  validateUUID(productId, 'productId', throwError);
  const validated = validateCreateReviewInput(input);

  // Verify product exists and is not soft-deleted
  const product = await prisma.product.findFirst({
    where: { id: productId, deletedAt: null },
  });

  if (!product) {
    throw new ProductNotFoundError();
  }

  // Create review
  const review = await prisma.productReview.create({
    data: {
      productId,
      authorName: validated.authorName,
      rating: validated.rating,
      comment: validated.comment,
      isAiGenerated: validated.isAiGenerated,
      isVisible: validated.isVisible,
    },
  });

  return review;
}

/**
 * Updates a product review.
 * Note: isAiGenerated is immutable and cannot be updated.
 * @param reviewId - Review UUID
 * @param input - Updated review data
 * @returns Updated review
 * @throws {InvalidProductReviewDataError} If validation fails
 * @throws {ProductReviewNotFoundError} If review not found
 */
export async function updateReview(
  reviewId: string,
  input: ValidatedUpdateReviewInput
): Promise<ProductReview> {
  function throwError(message: string, field: string): never {
    throw new InvalidProductReviewDataError(message, field);
  }

  validateUUID(reviewId, 'reviewId', throwError);
  const validated = validateUpdateReviewInput(input);

  // Verify review exists
  const existing = await prisma.productReview.findFirst({
    where: { id: reviewId },
  });

  if (!existing) {
    throw new ProductReviewNotFoundError();
  }

  // Update review
  const updated = await prisma.productReview.update({
    where: { id: reviewId },
    data: validated,
  });

  return updated;
}

/**
 * Deletes a product review.
 * @param reviewId - Review UUID
 * @throws {InvalidProductReviewDataError} If validation fails
 * @throws {ProductReviewNotFoundError} If review not found
 */
export async function deleteReview(reviewId: string): Promise<void> {
  function throwError(message: string, field: string): never {
    throw new InvalidProductReviewDataError(message, field);
  }

  validateUUID(reviewId, 'reviewId', throwError);

  // Verify review exists
  const existing = await prisma.productReview.findFirst({
    where: { id: reviewId },
  });

  if (!existing) {
    throw new ProductReviewNotFoundError();
  }

  // Delete review
  await prisma.productReview.delete({
    where: { id: reviewId },
  });
}

/**
 * Toggles review visibility (hide/show).
 * @param reviewId - Review UUID
 * @param input - Visibility toggle data
 * @returns Updated review
 * @throws {InvalidProductReviewDataError} If validation fails
 * @throws {ProductReviewNotFoundError} If review not found
 */
export async function toggleReviewVisibility(
  reviewId: string,
  input: ValidatedToggleVisibilityInput
): Promise<ProductReview> {
  function throwError(message: string, field: string): never {
    throw new InvalidProductReviewDataError(message, field);
  }

  validateUUID(reviewId, 'reviewId', throwError);
  const validated = validateToggleVisibilityInput(input);

  // Verify review exists
  const existing = await prisma.productReview.findFirst({
    where: { id: reviewId },
  });

  if (!existing) {
    throw new ProductReviewNotFoundError();
  }

  // Update visibility
  const updated = await prisma.productReview.update({
    where: { id: reviewId },
    data: { isVisible: validated.isVisible },
  });

  return updated;
}
