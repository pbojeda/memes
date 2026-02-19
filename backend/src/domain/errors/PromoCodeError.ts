/**
 * Base class for promo code-related errors.
 */
export class PromoCodeError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = 'PromoCodeError';
  }
}

/**
 * Thrown when promo code input data is invalid (e.g. missing or malformed fields).
 */
export class InvalidPromoCodeDataError extends PromoCodeError {
  constructor(
    message: string,
    public readonly field?: string
  ) {
    super(message, 'INVALID_PROMO_CODE_DATA');
    this.name = 'InvalidPromoCodeDataError';
  }
}

/**
 * Thrown when a promo code does not exist in the database.
 */
export class PromoCodeNotFoundError extends PromoCodeError {
  constructor() {
    super('Promo code not found', 'PROMO_CODE_NOT_FOUND');
    this.name = 'PromoCodeNotFoundError';
  }
}

/**
 * Thrown when a promo code's validUntil date has passed.
 */
export class PromoCodeExpiredError extends PromoCodeError {
  constructor() {
    super('Promo code has expired', 'PROMO_CODE_EXPIRED');
    this.name = 'PromoCodeExpiredError';
  }
}

/**
 * Thrown when a promo code is marked as inactive.
 */
export class PromoCodeInactiveError extends PromoCodeError {
  constructor() {
    super('Promo code is not active', 'PROMO_CODE_INACTIVE');
    this.name = 'PromoCodeInactiveError';
  }
}

/**
 * Thrown when a promo code has reached its maximum number of uses.
 */
export class PromoCodeUsageLimitError extends PromoCodeError {
  constructor() {
    super('Promo code usage limit reached', 'PROMO_CODE_USAGE_LIMIT');
    this.name = 'PromoCodeUsageLimitError';
  }
}

/**
 * Thrown when the order total does not meet the promo code's minimum order amount.
 */
export class MinOrderAmountNotMetError extends PromoCodeError {
  constructor(public readonly minOrderAmount: number) {
    super(
      `Order total does not meet minimum amount of ${minOrderAmount}`,
      'MIN_ORDER_AMOUNT_NOT_MET'
    );
    this.name = 'MinOrderAmountNotMetError';
  }
}

/**
 * Thrown when a promo code's validFrom date is in the future.
 */
export class PromoCodeNotYetValidError extends PromoCodeError {
  constructor() {
    super('Promo code is not yet valid', 'PROMO_CODE_NOT_YET_VALID');
    this.name = 'PromoCodeNotYetValidError';
  }
}
