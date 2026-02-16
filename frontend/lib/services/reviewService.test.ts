import { reviewService } from './reviewService';
import { apiClient } from '../api/client';
import { ApiException } from '../api/exceptions';
import {
  createReview,
  createReviewListResponse,
} from '@/components/product/testing/fixtures';

jest.mock('../api/client', () => ({
  apiClient: {
    get: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('reviewService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('should call GET /products/{productId}/reviews with empty params when none provided', async () => {
      const mockResponse = createReviewListResponse();
      mockApiClient.get.mockResolvedValueOnce({ data: mockResponse });

      const result = await reviewService.list('prod-123');

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/products/prod-123/reviews',
        { params: {} }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should pass page and limit params as query parameters', async () => {
      const mockResponse = createReviewListResponse();
      mockApiClient.get.mockResolvedValueOnce({ data: mockResponse });

      await reviewService.list('prod-123', { page: 2, limit: 5 });

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/products/prod-123/reviews',
        { params: { page: 2, limit: 5 } }
      );
    });

    it('should return empty data with meta when no reviews', async () => {
      const mockResponse = {
        data: [],
        meta: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
          averageRating: 0,
          ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        },
      };
      mockApiClient.get.mockResolvedValueOnce({ data: mockResponse });

      const result = await reviewService.list('prod-456');

      expect(result.data).toEqual([]);
      expect(result.meta?.total).toBe(0);
    });

    it('should propagate errors on network failure', async () => {
      mockApiClient.get.mockRejectedValueOnce(
        new ApiException('NETWORK_ERROR', 'Unable to connect', 0)
      );

      await expect(reviewService.list('prod-123')).rejects.toThrow(
        ApiException
      );
    });

    it('should omit undefined params from the request', async () => {
      const mockResponse = createReviewListResponse();
      mockApiClient.get.mockResolvedValueOnce({ data: mockResponse });

      await reviewService.list('prod-123', { page: 2, limit: undefined });

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/products/prod-123/reviews',
        { params: { page: 2 } }
      );
    });

    it('should include averageRating and ratingDistribution in meta', async () => {
      const mockResponse = createReviewListResponse({
        meta: {
          total: 15,
          page: 1,
          limit: 10,
          totalPages: 2,
          averageRating: 4.5,
          ratingDistribution: { 5: 10, 4: 3, 3: 1, 2: 1, 1: 0 },
        },
      });
      mockApiClient.get.mockResolvedValueOnce({ data: mockResponse });

      const result = await reviewService.list('prod-123');

      expect(result.meta?.averageRating).toBe(4.5);
      expect(result.meta?.ratingDistribution).toEqual({
        5: 10,
        4: 3,
        3: 1,
        2: 1,
        1: 0,
      });
    });
  });
});
