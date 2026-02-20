import { apiClient } from '../api/client';
import type { components } from '../api/types';

type CreateOrderRequest = components['schemas']['CreateOrderRequest'];

export type OrderCreateResult = {
  orderId: string;
  orderNumber: string;
  checkoutUrl: string;
};

export const orderService = {
  /**
   * Create a new order and get Stripe checkout URL.
   * Returns orderId, orderNumber, and checkoutUrl for payment.
   * Throws ApiException for HTTP 400 (validation errors) or network errors.
   *
   * @param data - Order creation request with shipping address, email, phone, etc.
   */
  async create(data: CreateOrderRequest): Promise<OrderCreateResult> {
    const response = await apiClient.post<{
      data: {
        orderId: string;
        orderNumber: string;
        checkoutUrl: string;
      };
    }>('/orders', data);
    return response.data.data!;
  },
};
