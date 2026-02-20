import type { components } from '@/lib/api/types';

export type OrderTotalResponse = components['schemas']['OrderTotalResponse'];
export type AppliedPromoCodeDetail = components['schemas']['AppliedPromoCodeDetail'];
export type CartValidationError = components['schemas']['CartValidationError'];
export type Address = components['schemas']['Address'];

/**
 * Factory for a valid OrderTotalResponse with sensible defaults.
 * Override any field via the `overrides` parameter.
 */
export function createOrderTotalResponse(
  overrides: Partial<OrderTotalResponse> = {}
): OrderTotalResponse {
  return {
    valid: true,
    subtotal: 79.98,
    discountAmount: 0,
    shippingCost: 0,
    taxAmount: 0,
    total: 79.98,
    currency: 'EUR',
    itemCount: 2,
    validatedItems: [],
    appliedPromoCode: null,
    cartErrors: [],
    ...overrides,
  };
}

/**
 * Factory for an AppliedPromoCodeDetail with sensible defaults.
 */
export function createAppliedPromoCode(
  overrides: Partial<AppliedPromoCodeDetail> = {}
): AppliedPromoCodeDetail {
  return {
    code: 'SUMMER20',
    discountType: 'PERCENTAGE',
    discountValue: 20,
    calculatedDiscount: 15.99,
    ...overrides,
  };
}

/**
 * Factory for a CartValidationError with sensible defaults.
 */
export function createCartValidationError(
  overrides: Partial<CartValidationError> = {}
): CartValidationError {
  return {
    productId: 'prod-invalid',
    code: 'PRODUCT_NOT_FOUND',
    message: 'Product not found',
    ...overrides,
  };
}

/**
 * Factory for an Address with sensible defaults.
 */
export function createAddress(
  overrides: Partial<Address> = {}
): Address {
  return {
    id: 'addr-1',
    label: 'Home',
    firstName: 'John',
    lastName: 'Doe',
    streetLine1: '123 Main St',
    streetLine2: 'Apt 4B',
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    countryCode: 'US',
    phone: '+1-555-555-5555',
    isDefault: false,
    ...overrides,
  };
}
