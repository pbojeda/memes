/**
 * Base class for product type-related errors.
 */
export class ProductTypeError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = 'ProductTypeError';
  }
}

/**
 * Thrown when a product type is not found.
 */
export class ProductTypeNotFoundError extends ProductTypeError {
  constructor() {
    super('Product type not found', 'PRODUCT_TYPE_NOT_FOUND');
    this.name = 'ProductTypeNotFoundError';
  }
}

/**
 * Thrown when attempting to create a product type with a slug that already exists.
 */
export class ProductTypeSlugAlreadyExistsError extends ProductTypeError {
  constructor() {
    super('A product type with this slug already exists', 'PRODUCT_TYPE_SLUG_ALREADY_EXISTS');
    this.name = 'ProductTypeSlugAlreadyExistsError';
  }
}

/**
 * Thrown when product type data is invalid.
 */
export class InvalidProductTypeDataError extends ProductTypeError {
  constructor(
    message: string,
    public readonly field?: string
  ) {
    super(message, 'INVALID_PRODUCT_TYPE_DATA');
    this.name = 'InvalidProductTypeDataError';
  }
}
