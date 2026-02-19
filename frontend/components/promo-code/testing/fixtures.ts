import type { PromoCodeValidationData } from '@/lib/services/promoCodeService';

/**
 * Factory for a successful (valid=true) promo code validation result.
 * The inner `data` object — already unwrapped from the API envelope.
 */
export const createValidPromoResult = (
  overrides: Partial<PromoCodeValidationData> = {}
): PromoCodeValidationData => ({
  valid: true,
  code: 'SUMMER20',
  discountType: 'PERCENTAGE',
  discountValue: 20,
  calculatedDiscount: 15.99,
  message: 'Promo code applied',
  ...overrides,
});

/**
 * Factory for a failed (valid=false) promo code validation result.
 * The inner `data` object — already unwrapped from the API envelope.
 */
export const createInvalidPromoResult = (
  overrides: Partial<PromoCodeValidationData> = {}
): PromoCodeValidationData => ({
  valid: false,
  code: 'EXPIRED10',
  message: 'Promo code has expired',
  ...overrides,
});
