import * as cartService from '../cartService';
import * as promoCodeService from '../promoCodeService';
import { calculateOrderTotal } from '../orderTotalService';
import { InvalidOrderTotalDataError } from '../../../domain/errors/OrderTotalError';
import type { CartValidationResult } from '../cartService';
import type { PromoCodeValidationResult } from '../promoCodeService';

jest.mock('../cartService');
jest.mock('../promoCodeService');

const mockCartService = cartService as jest.Mocked<typeof cartService>;
const mockPromoCodeService = promoCodeService as jest.Mocked<typeof promoCodeService>;

const PRODUCT_ID_1 = '123e4567-e89b-12d3-a456-426614174000';

function makeCartResult(overrides: Partial<CartValidationResult> = {}): CartValidationResult {
  return {
    valid: true,
    items: [
      {
        productId: PRODUCT_ID_1,
        quantity: 1,
        size: null,
        unitPrice: 100,
        subtotal: 100,
        product: {
          title: { es: 'Producto', en: 'Product' },
          slug: 'producto-test',
          primaryImage: null,
        },
        status: 'valid',
      },
    ],
    summary: {
      subtotal: 100,
      itemCount: 1,
    },
    errors: [],
    ...overrides,
  };
}

function makePromoResult(overrides: Partial<PromoCodeValidationResult> = {}): PromoCodeValidationResult {
  return {
    valid: true,
    code: 'SUMMER20',
    discountType: 'PERCENTAGE',
    discountValue: 20,
    calculatedDiscount: 20,
    message: 'Promo code applied',
    ...overrides,
  };
}

describe('orderTotalService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateOrderTotal', () => {
    describe('no promo code', () => {
      it('should return valid result with correct fields when no promoCode', async () => {
        mockCartService.validateCart.mockResolvedValue(makeCartResult());

        const result = await calculateOrderTotal({
          items: [{ productId: PRODUCT_ID_1, quantity: 1 }],
        });

        expect(result.valid).toBe(true);
        expect(result.subtotal).toBe(100);
        expect(result.discountAmount).toBe(0);
        expect(result.shippingCost).toBe(0);
        expect(result.taxAmount).toBe(0);
        expect(result.total).toBe(100);
        expect(result.currency).toBe('MXN');
        expect(result.itemCount).toBe(1);
        expect(result.validatedItems).toHaveLength(1);
        expect(result.appliedPromoCode).toBeNull();
        expect(result.cartErrors).toEqual([]);
      });

      it('should call validateCart with the input items', async () => {
        mockCartService.validateCart.mockResolvedValue(makeCartResult());

        const items = [{ productId: PRODUCT_ID_1, quantity: 1 }];
        await calculateOrderTotal({ items });

        expect(mockCartService.validateCart).toHaveBeenCalledWith({ items });
      });

      it('should NOT call validatePromoCode when no promoCode in input', async () => {
        mockCartService.validateCart.mockResolvedValue(makeCartResult());

        await calculateOrderTotal({
          items: [{ productId: PRODUCT_ID_1, quantity: 1 }],
        });

        expect(mockPromoCodeService.validatePromoCode).not.toHaveBeenCalled();
      });
    });

    describe('with valid promo code (PERCENTAGE)', () => {
      it('should call validatePromoCode with code and subtotal as orderTotal', async () => {
        mockCartService.validateCart.mockResolvedValue(makeCartResult());
        mockPromoCodeService.validatePromoCode.mockResolvedValue(makePromoResult());

        await calculateOrderTotal({
          items: [{ productId: PRODUCT_ID_1, quantity: 1 }],
          promoCode: 'SUMMER20',
        });

        expect(mockPromoCodeService.validatePromoCode).toHaveBeenCalledWith({
          code: 'SUMMER20',
          orderTotal: 100,
        });
      });

      it('should return discountAmount of 20 for 20% on 100', async () => {
        mockCartService.validateCart.mockResolvedValue(makeCartResult());
        mockPromoCodeService.validatePromoCode.mockResolvedValue(makePromoResult());

        const result = await calculateOrderTotal({
          items: [{ productId: PRODUCT_ID_1, quantity: 1 }],
          promoCode: 'SUMMER20',
        });

        expect(result.discountAmount).toBe(20);
      });

      it('should return total of 80 (100 - 20)', async () => {
        mockCartService.validateCart.mockResolvedValue(makeCartResult());
        mockPromoCodeService.validatePromoCode.mockResolvedValue(makePromoResult());

        const result = await calculateOrderTotal({
          items: [{ productId: PRODUCT_ID_1, quantity: 1 }],
          promoCode: 'SUMMER20',
        });

        expect(result.total).toBe(80);
      });

      it('should return appliedPromoCode with correct fields', async () => {
        mockCartService.validateCart.mockResolvedValue(makeCartResult());
        mockPromoCodeService.validatePromoCode.mockResolvedValue(makePromoResult());

        const result = await calculateOrderTotal({
          items: [{ productId: PRODUCT_ID_1, quantity: 1 }],
          promoCode: 'SUMMER20',
        });

        expect(result.appliedPromoCode).toEqual({
          code: 'SUMMER20',
          discountType: 'PERCENTAGE',
          discountValue: 20,
          calculatedDiscount: 20,
        });
      });
    });

    describe('with invalid promo code', () => {
      it('should return valid=true overall when promo code is invalid (cart is fine)', async () => {
        mockCartService.validateCart.mockResolvedValue(makeCartResult());
        mockPromoCodeService.validatePromoCode.mockResolvedValue({
          valid: false,
          code: 'EXPIRED20',
          message: 'Promo code has expired',
        });

        const result = await calculateOrderTotal({
          items: [{ productId: PRODUCT_ID_1, quantity: 1 }],
          promoCode: 'EXPIRED20',
        });

        expect(result.valid).toBe(true);
      });

      it('should return discountAmount of 0 when promo code is invalid', async () => {
        mockCartService.validateCart.mockResolvedValue(makeCartResult());
        mockPromoCodeService.validatePromoCode.mockResolvedValue({
          valid: false,
          code: 'EXPIRED20',
          message: 'Promo code has expired',
        });

        const result = await calculateOrderTotal({
          items: [{ productId: PRODUCT_ID_1, quantity: 1 }],
          promoCode: 'EXPIRED20',
        });

        expect(result.discountAmount).toBe(0);
      });

      it('should return total of 100 when promo code is invalid', async () => {
        mockCartService.validateCart.mockResolvedValue(makeCartResult());
        mockPromoCodeService.validatePromoCode.mockResolvedValue({
          valid: false,
          code: 'EXPIRED20',
          message: 'Promo code has expired',
        });

        const result = await calculateOrderTotal({
          items: [{ productId: PRODUCT_ID_1, quantity: 1 }],
          promoCode: 'EXPIRED20',
        });

        expect(result.total).toBe(100);
      });

      it('should return appliedPromoCode=null when promo code is invalid', async () => {
        mockCartService.validateCart.mockResolvedValue(makeCartResult());
        mockPromoCodeService.validatePromoCode.mockResolvedValue({
          valid: false,
          code: 'EXPIRED20',
          message: 'Promo code has expired',
        });

        const result = await calculateOrderTotal({
          items: [{ productId: PRODUCT_ID_1, quantity: 1 }],
          promoCode: 'EXPIRED20',
        });

        expect(result.appliedPromoCode).toBeNull();
      });

      it('should return promoCodeMessage from promoCodeService result', async () => {
        mockCartService.validateCart.mockResolvedValue(makeCartResult());
        mockPromoCodeService.validatePromoCode.mockResolvedValue({
          valid: false,
          code: 'EXPIRED20',
          message: 'Promo code has expired',
        });

        const result = await calculateOrderTotal({
          items: [{ productId: PRODUCT_ID_1, quantity: 1 }],
          promoCode: 'EXPIRED20',
        });

        expect(result.promoCodeMessage).toBe('Promo code has expired');
      });
    });

    describe('edge case — calculatedDiscount is null', () => {
      it('should return discountAmount=0 when calculatedDiscount is null', async () => {
        mockCartService.validateCart.mockResolvedValue(makeCartResult());
        mockPromoCodeService.validatePromoCode.mockResolvedValue(
          makePromoResult({ calculatedDiscount: null })
        );

        const result = await calculateOrderTotal({
          items: [{ productId: PRODUCT_ID_1, quantity: 1 }],
          promoCode: 'SUMMER20',
        });

        expect(result.discountAmount).toBe(0);
        expect(result.appliedPromoCode).toBeNull();
      });
    });

    describe('cart is invalid', () => {
      it('should return valid=false when cart has errors', async () => {
        mockCartService.validateCart.mockResolvedValue(
          makeCartResult({
            valid: false,
            items: [],
            summary: { subtotal: 0, itemCount: 0 },
            errors: [
              { productId: PRODUCT_ID_1, code: 'PRODUCT_NOT_FOUND', message: 'Product not found' },
            ],
          })
        );

        const result = await calculateOrderTotal({
          items: [{ productId: PRODUCT_ID_1, quantity: 1 }],
        });

        expect(result.valid).toBe(false);
      });

      it('should return cart errors in cartErrors field', async () => {
        const cartErrors = [
          { productId: PRODUCT_ID_1, code: 'PRODUCT_NOT_FOUND' as const, message: 'Product not found' },
        ];
        mockCartService.validateCart.mockResolvedValue(
          makeCartResult({
            valid: false,
            items: [],
            summary: { subtotal: 0, itemCount: 0 },
            errors: cartErrors,
          })
        );

        const result = await calculateOrderTotal({
          items: [{ productId: PRODUCT_ID_1, quantity: 1 }],
        });

        expect(result.cartErrors).toEqual(cartErrors);
      });

      it('should still process promo code when cart has errors (uses subtotal of 0)', async () => {
        mockCartService.validateCart.mockResolvedValue(
          makeCartResult({
            valid: false,
            items: [],
            summary: { subtotal: 0, itemCount: 0 },
            errors: [
              { productId: PRODUCT_ID_1, code: 'PRODUCT_NOT_FOUND', message: 'Product not found' },
            ],
          })
        );
        mockPromoCodeService.validatePromoCode.mockResolvedValue(makePromoResult({
          calculatedDiscount: 0,
        }));

        const result = await calculateOrderTotal({
          items: [{ productId: PRODUCT_ID_1, quantity: 1 }],
          promoCode: 'SUMMER20',
        });

        expect(mockPromoCodeService.validatePromoCode).toHaveBeenCalledWith({
          code: 'SUMMER20',
          orderTotal: 0,
        });
        expect(result.subtotal).toBe(0);
        expect(result.total).toBe(0);
      });
    });

    describe('total floor at 0', () => {
      it('should floor total at 0 if discount somehow exceeds subtotal', async () => {
        // Cart result has subtotal of 10
        mockCartService.validateCart.mockResolvedValue(
          makeCartResult({
            summary: { subtotal: 10, itemCount: 1 },
          })
        );
        // Discount larger than subtotal (edge case)
        mockPromoCodeService.validatePromoCode.mockResolvedValue(
          makePromoResult({ calculatedDiscount: 15 })
        );

        const result = await calculateOrderTotal({
          items: [{ productId: PRODUCT_ID_1, quantity: 1 }],
          promoCode: 'SUMMER20',
        });

        expect(result.total).toBe(0);
      });
    });

    describe('monetary rounding', () => {
      it('should round discountAmount to 2 decimal places', async () => {
        mockCartService.validateCart.mockResolvedValue(
          makeCartResult({ summary: { subtotal: 33.33, itemCount: 1 } })
        );
        mockPromoCodeService.validatePromoCode.mockResolvedValue(
          makePromoResult({ calculatedDiscount: 3.3333 })
        );

        const result = await calculateOrderTotal({
          items: [{ productId: PRODUCT_ID_1, quantity: 1 }],
          promoCode: 'SUMMER20',
        });

        expect(result.discountAmount).toBe(3.33);
      });

      it('should round total to 2 decimal places', async () => {
        mockCartService.validateCart.mockResolvedValue(
          makeCartResult({ summary: { subtotal: 33.33, itemCount: 1 } })
        );
        mockPromoCodeService.validatePromoCode.mockResolvedValue(
          makePromoResult({ calculatedDiscount: 3.3333 })
        );

        const result = await calculateOrderTotal({
          items: [{ productId: PRODUCT_ID_1, quantity: 1 }],
          promoCode: 'SUMMER20',
        });

        expect(result.total).toBe(30);
      });

      it('should handle 0.1 + 0.2 floating point edge case', async () => {
        // subtotal = 0.3 (represented as 0.1+0.2 in float)
        mockCartService.validateCart.mockResolvedValue(
          makeCartResult({ summary: { subtotal: 0.1 + 0.2, itemCount: 1 } })
        );

        const result = await calculateOrderTotal({
          items: [{ productId: PRODUCT_ID_1, quantity: 1 }],
        });

        expect(result.total).toBe(0.3);
      });
    });

    describe('input validation throws', () => {
      it('should throw InvalidOrderTotalDataError for empty items', async () => {
        await expect(
          calculateOrderTotal({ items: [] })
        ).rejects.toThrow(InvalidOrderTotalDataError);
      });

      it('should throw InvalidOrderTotalDataError for invalid productId', async () => {
        await expect(
          calculateOrderTotal({
            items: [{ productId: 'not-a-uuid', quantity: 1 }],
          })
        ).rejects.toThrow(InvalidOrderTotalDataError);
      });

      it('should throw InvalidOrderTotalDataError for invalid promoCode type (number)', async () => {
        await expect(
          calculateOrderTotal({
            items: [{ productId: PRODUCT_ID_1, quantity: 1 }],
            promoCode: 42 as unknown as string,
          } as unknown as { items: Array<{ productId: string; quantity: number }> })
        ).rejects.toThrow(InvalidOrderTotalDataError);
      });
    });

    describe('FIXED_AMOUNT promo code', () => {
      it('should return discountAmount equal to the fixed amount', async () => {
        mockCartService.validateCart.mockResolvedValue(makeCartResult());
        mockPromoCodeService.validatePromoCode.mockResolvedValue(
          makePromoResult({
            code: 'SAVE10',
            discountType: 'FIXED_AMOUNT',
            discountValue: 10,
            calculatedDiscount: 10,
            message: 'Promo code applied',
          })
        );

        const result = await calculateOrderTotal({
          items: [{ productId: PRODUCT_ID_1, quantity: 1 }],
          promoCode: 'SAVE10',
        });

        expect(result.discountAmount).toBe(10);
      });

      it('should return correct total for FIXED_AMOUNT', async () => {
        mockCartService.validateCart.mockResolvedValue(makeCartResult());
        mockPromoCodeService.validatePromoCode.mockResolvedValue(
          makePromoResult({
            code: 'SAVE10',
            discountType: 'FIXED_AMOUNT',
            discountValue: 10,
            calculatedDiscount: 10,
          })
        );

        const result = await calculateOrderTotal({
          items: [{ productId: PRODUCT_ID_1, quantity: 1 }],
          promoCode: 'SAVE10',
        });

        expect(result.total).toBe(90);
      });
    });
  });
});
