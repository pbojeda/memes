import { checkoutService } from '../checkoutService';
import { apiClient } from '../../api/client';
import { ApiException } from '../../api/exceptions';
import {
  createOrderTotalResponse,
  createAppliedPromoCode,
} from '../../../components/checkout/testing/fixtures';

// Must use relative path — jest.mock() doesn't resolve @/ aliases
jest.mock('../../api/client', () => ({
  apiClient: {
    post: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

const sampleItems = [
  { productId: 'prod-1', quantity: 2, size: 'M' },
  { productId: 'prod-2', quantity: 1, size: 'L' },
];

describe('checkoutService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateTotals', () => {
    it('should call POST /cart/calculate with items and promoCode', async () => {
      const data = createOrderTotalResponse();
      mockApiClient.post.mockResolvedValueOnce({ data: { data } });

      await checkoutService.calculateTotals(sampleItems, 'SUMMER20');

      expect(mockApiClient.post).toHaveBeenCalledWith('/cart/calculate', {
        items: sampleItems,
        promoCode: 'SUMMER20',
      });
    });

    it('should call POST /cart/calculate without promoCode when not provided', async () => {
      const data = createOrderTotalResponse();
      mockApiClient.post.mockResolvedValueOnce({ data: { data } });

      await checkoutService.calculateTotals(sampleItems);

      expect(mockApiClient.post).toHaveBeenCalledWith('/cart/calculate', {
        items: sampleItems,
      });
    });

    it('should return unwrapped OrderTotalResponse data', async () => {
      const data = createOrderTotalResponse();
      mockApiClient.post.mockResolvedValueOnce({ data: { data } });

      const result = await checkoutService.calculateTotals(sampleItems);

      expect(result).toEqual(data);
      expect(result.valid).toBe(true);
      expect(result.subtotal).toBe(79.98);
      expect(result.total).toBe(79.98);
    });

    it('should return response with applied promo code when discount is present', async () => {
      const appliedPromoCode = createAppliedPromoCode();
      const data = createOrderTotalResponse({
        discountAmount: 15.99,
        total: 63.99,
        appliedPromoCode,
      });
      mockApiClient.post.mockResolvedValueOnce({ data: { data } });

      const result = await checkoutService.calculateTotals(sampleItems, 'SUMMER20');

      expect(result.appliedPromoCode).toEqual(appliedPromoCode);
      expect(result.discountAmount).toBe(15.99);
      expect(result.total).toBe(63.99);
    });

    it('should throw ApiException for HTTP 400 (input validation error)', async () => {
      const error = new ApiException('INVALID_CART_DATA', 'items is required', 400);
      mockApiClient.post.mockRejectedValueOnce(error);

      const caught = await checkoutService.calculateTotals([]).catch((e: unknown) => e);

      expect(caught).toBeInstanceOf(ApiException);
      expect(caught).toMatchObject({
        status: 400,
        code: 'INVALID_CART_DATA',
      });
    });

    it('should propagate network errors', async () => {
      const error = new ApiException('NETWORK_ERROR', 'Unable to connect to server', 0);
      mockApiClient.post.mockRejectedValueOnce(error);

      await expect(checkoutService.calculateTotals(sampleItems)).rejects.toThrow(ApiException);
    });
  });
});
