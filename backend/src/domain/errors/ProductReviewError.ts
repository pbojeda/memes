/**
 * Base class for product review-related errors.
 */
export class ProductReviewError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = 'ProductReviewError';
  }
}

/**
 * Thrown when a product review is not found.
 */
export class ProductReviewNotFoundError extends ProductReviewError {
  constructor() {
    super('Product review not found', 'PRODUCT_REVIEW_NOT_FOUND');
    this.name = 'ProductReviewNotFoundError';
  }
}

/**
 * Thrown when product review data is invalid.
 */
export class InvalidProductReviewDataError extends ProductReviewError {
  constructor(
    message: string,
    public readonly field?: string
  ) {
    super(message, 'INVALID_PRODUCT_REVIEW_DATA');
    this.name = 'InvalidProductReviewDataError';
  }
}
