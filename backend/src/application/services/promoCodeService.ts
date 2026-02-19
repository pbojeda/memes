import prisma from '../../lib/prisma';
import type { DiscountType } from '../../generated/prisma/enums';
import {
  validatePromoCodeInput,
  type PromoCodeValidationInput,
} from '../validators/promoCodeValidator';

export interface PromoCodeValidationResult {
  valid: boolean;
  code: string;
  discountType?: DiscountType;
  discountValue?: number;
  calculatedDiscount?: number | null;
  message: string;
}

/**
 * Validates a promo code and calculates the discount amount.
 * Returns a structured result for all business logic outcomes.
 * Only throws for invalid input (propagated from validator).
 *
 * @throws {InvalidPromoCodeDataError} If input validation fails
 */
export async function validatePromoCode(
  input: PromoCodeValidationInput
): Promise<PromoCodeValidationResult> {
  const validated = validatePromoCodeInput(input);

  const promoCode = await prisma.promoCode.findUnique({
    where: { code: validated.code },
  });

  if (!promoCode) {
    return {
      valid: false,
      code: validated.code,
      message: 'Promo code not found',
    };
  }

  const now = new Date();

  if (!promoCode.isActive) {
    return {
      valid: false,
      code: promoCode.code,
      message: 'Promo code is not active',
    };
  }

  if (now < promoCode.validFrom) {
    return {
      valid: false,
      code: promoCode.code,
      message: 'Promo code is not yet valid',
    };
  }

  if (promoCode.validUntil !== null && now > promoCode.validUntil) {
    return {
      valid: false,
      code: promoCode.code,
      message: 'Promo code has expired',
    };
  }

  // maxUsesPerUser enforcement deferred to order placement — requires user context
  if (promoCode.maxUses !== null && promoCode.currentUses >= promoCode.maxUses) {
    return {
      valid: false,
      code: promoCode.code,
      message: 'Promo code usage limit reached',
    };
  }

  if (
    promoCode.minOrderAmount !== null &&
    validated.orderTotal !== undefined &&
    validated.orderTotal < Number(promoCode.minOrderAmount)
  ) {
    return {
      valid: false,
      code: promoCode.code,
      message: `Order total does not meet minimum amount of ${Number(promoCode.minOrderAmount)}`,
    };
  }

  // All checks passed — calculate discount
  const discountValue = Number(promoCode.discountValue);
  const maxDiscountAmount =
    promoCode.maxDiscountAmount !== null ? Number(promoCode.maxDiscountAmount) : null;

  let calculatedDiscount: number | null;

  if (promoCode.discountType === 'PERCENTAGE') {
    if (validated.orderTotal === undefined) {
      calculatedDiscount = null;
    } else {
      let calc = validated.orderTotal * (discountValue / 100);
      if (maxDiscountAmount !== null && calc > maxDiscountAmount) {
        calc = maxDiscountAmount;
      }
      if (calc > validated.orderTotal) {
        calc = validated.orderTotal;
      }
      calculatedDiscount = Math.round(calc * 100) / 100;
    }
  } else {
    // FIXED_AMOUNT
    let calc = discountValue;
    if (validated.orderTotal !== undefined && calc > validated.orderTotal) {
      calc = validated.orderTotal;
    }
    calculatedDiscount = Math.round(calc * 100) / 100;
  }

  return {
    valid: true,
    code: promoCode.code,
    discountType: promoCode.discountType,
    discountValue,
    calculatedDiscount,
    message: 'Promo code applied',
  };
}
