import { orderService } from './orderService';
import { apiClient } from '../api/client';
import { ApiException } from '../api/exceptions';
import type { components } from '../api/types';

type CreateOrderRequest = components['schemas']['CreateOrderRequest'];
type CreateAddressRequest = components['schemas']['CreateAddressRequest'];

jest.mock('../api/client', () => ({
  apiClient: {
    post: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

const mockShippingAddress: CreateAddressRequest = {
  firstName: 'John',
  lastName: 'Doe',
  streetLine1: '123 Main St',
  city: 'New York',
  postalCode: '10001',
  countryCode: 'US',
};

const mockCreateOrderRequest: CreateOrderRequest = {
  shippingAddress: mockShippingAddress,
  email: 'test@example.com',
  phone: '+1-555-555-5555',
  successUrl: 'https://example.com/success',
  cancelUrl: 'https://example.com/cancel',
};

const mockCreateOrderResponse = {
  data: {
    orderId: 'order-123',
    orderNumber: 'ORD-2026-001',
    checkoutUrl: 'https://checkout.stripe.com/c/pay/cs_test_123',
  },
};

describe('orderService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should call POST /orders with request body', async () => {
      mockApiClient.post.mockResolvedValueOnce({ data: mockCreateOrderResponse });

      await orderService.create(mockCreateOrderRequest);

      expect(mockApiClient.post).toHaveBeenCalledWith('/orders', mockCreateOrderRequest);
    });

    it('should return unwrapped response data with orderId, orderNumber, checkoutUrl', async () => {
      mockApiClient.post.mockResolvedValueOnce({ data: mockCreateOrderResponse });

      const result = await orderService.create(mockCreateOrderRequest);

      expect(result).toEqual({
        orderId: 'order-123',
        orderNumber: 'ORD-2026-001',
        checkoutUrl: 'https://checkout.stripe.com/c/pay/cs_test_123',
      });
    });

    it('should propagate ApiException on 400 validation error', async () => {
      mockApiClient.post.mockRejectedValueOnce(
        new ApiException('VALIDATION_ERROR', 'Invalid order data', 400)
      );

      await expect(orderService.create(mockCreateOrderRequest)).rejects.toThrow(ApiException);
    });

    it('should propagate ApiException on network error', async () => {
      mockApiClient.post.mockRejectedValueOnce(
        new ApiException('NETWORK_ERROR', 'Network request failed', 0)
      );

      await expect(orderService.create(mockCreateOrderRequest)).rejects.toThrow(ApiException);
    });
  });
});
