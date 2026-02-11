/**
 * Base class for product-related errors.
 */
export class ProductError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = 'ProductError';
  }
}

/**
 * Thrown when a product is not found.
 */
export class ProductNotFoundError extends ProductError {
  constructor() {
    super('Product not found', 'PRODUCT_NOT_FOUND');
    this.name = 'ProductNotFoundError';
  }
}

/**
 * Thrown when attempting to create a product with a slug that already exists.
 */
export class ProductSlugAlreadyExistsError extends ProductError {
  constructor() {
    super('A product with this slug already exists', 'PRODUCT_SLUG_ALREADY_EXISTS');
    this.name = 'ProductSlugAlreadyExistsError';
  }
}

/**
 * Thrown when product data is invalid.
 */
export class InvalidProductDataError extends ProductError {
  constructor(
    message: string,
    public readonly field?: string
  ) {
    super(message, 'INVALID_PRODUCT_DATA');
    this.name = 'InvalidProductDataError';
  }
}
