import { promoCodeService } from '../promoCodeService';
import { apiClient } from '../../api/client';
import { ApiException } from '../../api/exceptions';
import { createValidPromoResult, createInvalidPromoResult } from '../../../components/promo-code/testing/fixtures';

// Must use relative path — jest.mock() doesn't resolve @/ aliases
jest.mock('../../api/client', () => ({
  apiClient: {
    post: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('promoCodeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('should call POST /promo-codes/validate with code and orderTotal', async () => {
      const data = createValidPromoResult();
      mockApiClient.post.mockResolvedValueOnce({ data: { data } });

      await promoCodeService.validate('SUMMER20', 79.99);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/promo-codes/validate',
        { code: 'SUMMER20', orderTotal: 79.99 }
      );
    });

    it('should call POST /promo-codes/validate without orderTotal when not provided', async () => {
      const data = createValidPromoResult();
      mockApiClient.post.mockResolvedValueOnce({ data: { data } });

      await promoCodeService.validate('SUMMER20');

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/promo-codes/validate',
        { code: 'SUMMER20' }
      );
    });

    it('should return unwrapped data for a valid code', async () => {
      const data = createValidPromoResult();
      mockApiClient.post.mockResolvedValueOnce({ data: { data } });

      const result = await promoCodeService.validate('SUMMER20', 79.99);

      expect(result).toEqual(data);
      expect(result.valid).toBe(true);
      expect(result.discountType).toBe('PERCENTAGE');
      expect(result.calculatedDiscount).toBe(15.99);
    });

    it('should return unwrapped data for an invalid code (valid=false) without throwing', async () => {
      const data = createInvalidPromoResult();
      mockApiClient.post.mockResolvedValueOnce({ data: { data } });

      const result = await promoCodeService.validate('EXPIRED10', 79.99);

      expect(result).toEqual(data);
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Promo code has expired');
    });

    it('should throw ApiException for HTTP 400 (input validation error)', async () => {
      const error = new ApiException('INVALID_PROMO_CODE_DATA', 'code is required', 400);
      mockApiClient.post.mockRejectedValueOnce(error);

      const caught = await promoCodeService.validate('').catch((e: unknown) => e);

      expect(caught).toBeInstanceOf(ApiException);
      expect(caught).toMatchObject({
        status: 400,
        code: 'INVALID_PROMO_CODE_DATA',
      });
    });

    it('should propagate network errors', async () => {
      const error = new ApiException('NETWORK_ERROR', 'Unable to connect to server', 0);
      mockApiClient.post.mockRejectedValueOnce(error);

      await expect(promoCodeService.validate('SUMMER20')).rejects.toThrow(ApiException);
    });
  });
});
