import {
  validateOrderTotalInput,
  type OrderTotalCalculationInput,
} from '../validators/orderTotalValidator';
import { validateCart, type CartValidationResult } from './cartService';
import { validatePromoCode } from './promoCodeService';
import type { DiscountType } from '../../generated/prisma/enums';

const ORDER_TOTAL_CONSTANTS = {
  SHIPPING_COST: 0,
  TAX_RATE: 0,
  CURRENCY: 'MXN',
} as const;

export interface AppliedPromoCodeInfo {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  calculatedDiscount: number;
}

export interface OrderTotalResult {
  valid: boolean;
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  taxAmount: number;
  total: number;
  currency: string;
  itemCount: number;
  validatedItems: CartValidationResult['items'];
  appliedPromoCode: AppliedPromoCodeInfo | null;
  promoCodeMessage?: string;
  cartErrors: CartValidationResult['errors'];
}

/**
 * Calculates the full order financial breakdown from validated cart data
 * and an optional promo code. Orchestrates validateCart and validatePromoCode.
 *
 * @throws {InvalidOrderTotalDataError} If input validation fails (propagated from validator)
 */
export async function calculateOrderTotal(
  input: OrderTotalCalculationInput
): Promise<OrderTotalResult> {
  // 1. Validate input — throws InvalidOrderTotalDataError on malformed input
  const validated = validateOrderTotalInput(input);

  // 2. Validate cart
  const cartResult = await validateCart({ items: validated.items });

  // 3. Extract subtotal from cart result
  // Note: subtotal reflects only valid items when cart is partially invalid
  const subtotal = cartResult.summary.subtotal;

  // 4. Handle promo code if provided
  let discountAmount = 0;
  let appliedPromoCode: AppliedPromoCodeInfo | null = null;
  let promoCodeMessage: string | undefined;

  if (validated.promoCode !== undefined) {
    const promoCodeResult = await validatePromoCode({
      code: validated.promoCode,
      orderTotal: subtotal,
    });

    if (
      promoCodeResult.valid === true &&
      promoCodeResult.calculatedDiscount !== null &&
      promoCodeResult.calculatedDiscount !== undefined &&
      promoCodeResult.discountType !== undefined &&
      promoCodeResult.discountValue !== undefined
    ) {
      discountAmount = Math.round(promoCodeResult.calculatedDiscount * 100) / 100;
      appliedPromoCode = {
        code: promoCodeResult.code,
        discountType: promoCodeResult.discountType,
        discountValue: promoCodeResult.discountValue,
        calculatedDiscount: discountAmount,
      };
    } else {
      discountAmount = 0;
      appliedPromoCode = null;
      promoCodeMessage = promoCodeResult.message;
    }
  }

  // 5. Calculate shipping and tax
  // Note: discountAmount is pre-rounded; when TAX_RATE > 0, tax base uses the rounded discount
  const shippingCost = ORDER_TOTAL_CONSTANTS.SHIPPING_COST;
  const taxAmount =
    Math.round(ORDER_TOTAL_CONSTANTS.TAX_RATE * (subtotal - discountAmount) * 100) / 100;

  // 6. Calculate total (floored at 0)
  const rawTotal = subtotal - discountAmount + shippingCost + taxAmount;
  const total = Math.round(Math.max(0, rawTotal) * 100) / 100;

  // 7. Build result
  const result: OrderTotalResult = {
    valid: cartResult.valid,
    subtotal,
    discountAmount,
    shippingCost,
    taxAmount,
    total,
    currency: ORDER_TOTAL_CONSTANTS.CURRENCY,
    itemCount: cartResult.summary.itemCount,
    validatedItems: cartResult.items,
    appliedPromoCode,
    cartErrors: cartResult.errors,
  };

  if (promoCodeMessage !== undefined) {
    result.promoCodeMessage = promoCodeMessage;
  }

  return result;
}
