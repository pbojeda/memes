/**
 * Base class for price history-related errors.
 */
export class PriceHistoryError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = 'PriceHistoryError';
  }
}

/**
 * Thrown when a price history record is not found.
 */
export class PriceHistoryNotFoundError extends PriceHistoryError {
  constructor() {
    super('Price history record not found', 'PRICE_HISTORY_NOT_FOUND');
    this.name = 'PriceHistoryNotFoundError';
  }
}

/**
 * Thrown when price history data is invalid.
 *
 * @example
 * throw new InvalidPriceHistoryDataError('Price must be positive', 'price');
 * throw new InvalidPriceHistoryDataError('Reason exceeds 255 characters', 'reason');
 */
export class InvalidPriceHistoryDataError extends PriceHistoryError {
  constructor(
    message: string,
    public readonly field?: string
  ) {
    super(message, 'INVALID_PRICE_HISTORY_DATA');
    this.name = 'InvalidPriceHistoryDataError';
  }
}
