import { apiClient } from '../api/client';
import type { components } from '../api/types';

export type PromoCodeValidationData = NonNullable<
  components['schemas']['PromoCodeValidationResponse']['data']
>;

export interface ValidatePromoCodeRequest {
  code: string;
  orderTotal?: number;
}

export const promoCodeService = {
  /**
   * Validate a promo code against the backend.
   * Returns the validation result for both valid (valid=true) and invalid (valid=false) codes.
   * Does NOT throw for valid=false — only throws ApiException for HTTP 400 (input errors).
   *
   * @param code - The promo code string (will be uppercased by the backend validator)
   * @param orderTotal - Optional order total for discount calculation
   */
  async validate(code: string, orderTotal?: number): Promise<PromoCodeValidationData> {
    const body: ValidatePromoCodeRequest = { code };
    if (orderTotal !== undefined) {
      body.orderTotal = orderTotal;
    }
    const response = await apiClient.post<{ data: PromoCodeValidationData }>(
      '/promo-codes/validate',
      body
    );
    return response.data.data;
  },
};
