/**
 * Base class for product image-related errors.
 */
export class ProductImageError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = 'ProductImageError';
  }
}

/**
 * Thrown when a product image is not found.
 */
export class ProductImageNotFoundError extends ProductImageError {
  constructor() {
    super('Product image not found', 'PRODUCT_IMAGE_NOT_FOUND');
    this.name = 'ProductImageNotFoundError';
  }
}

/**
 * Thrown when product image data is invalid.
 */
export class InvalidProductImageDataError extends ProductImageError {
  constructor(
    message: string,
    public readonly field?: string
  ) {
    super(message, 'INVALID_PRODUCT_IMAGE_DATA');
    this.name = 'InvalidProductImageDataError';
  }
}
