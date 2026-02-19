/**
 * Base class for order total calculation errors.
 */
export class OrderTotalError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = 'OrderTotalError';
  }
}

/**
 * Thrown when order total calculation input data is invalid.
 */
export class InvalidOrderTotalDataError extends OrderTotalError {
  constructor(
    message: string,
    public readonly field?: string
  ) {
    super(message, 'INVALID_ORDER_TOTAL_DATA');
    this.name = 'InvalidOrderTotalDataError';
  }
}
