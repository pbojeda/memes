import { apiClient } from '../api/client';
import { ApiException } from '../api/exceptions';
import type { components } from '../api/types';

export type OrderTotalResponse = components['schemas']['OrderTotalResponse'];
export type OrderTotalRequest = components['schemas']['OrderTotalRequest'];

export const checkoutService = {
  /**
   * Calculate order totals by calling the backend cart validation endpoint.
   * Returns the full OrderTotalResponse including promo code discounts and cart errors.
   * Throws ApiException for HTTP 400 (input validation errors) or network errors.
   *
   * @param items - Cart items to validate and price
   * @param promoCode - Optional promo code to apply
   */
  async calculateTotals(
    items: OrderTotalRequest['items'],
    promoCode?: string
  ): Promise<OrderTotalResponse> {
    if (items.length === 0) {
      throw new ApiException('EMPTY_CART', 'Cart must contain at least one item', 400);
    }
    const body: OrderTotalRequest = { items };
    if (promoCode !== undefined) {
      body.promoCode = promoCode;
    }
    const response = await apiClient.post<{ data: OrderTotalResponse }>(
      '/cart/calculate',
      body
    );
    return response.data.data;
  },
};
