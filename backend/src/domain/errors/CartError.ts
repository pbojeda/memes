/**
 * Base class for cart-related errors.
 */
export class CartError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = 'CartError';
  }
}

/**
 * Thrown when cart input data is invalid.
 */
export class InvalidCartDataError extends CartError {
  constructor(
    message: string,
    public readonly field?: string
  ) {
    super(message, 'INVALID_CART_DATA');
    this.name = 'InvalidCartDataError';
  }
}
