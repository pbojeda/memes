import { productService } from './productService';
import { apiClient } from '../api/client';
import { ApiException } from '../api/exceptions';

// Mock apiClient
jest.mock('../api/client', () => ({
  apiClient: {
    get: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

// Mock data
const mockProduct = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  typeSlug: 't-shirts',
  slug: 'funny-cat-tshirt',
  title: 'Funny Cat T-Shirt',
  description: 'A hilarious cat meme on a comfortable t-shirt',
  price: 29.99,
  isHot: true,
  stock: 50,
  images: [],
  createdAt: '2026-02-01T00:00:00Z',
};

const mockProduct2 = {
  id: '223e4567-e89b-12d3-a456-426614174001',
  typeSlug: 'mugs',
  slug: 'grumpy-cat-mug',
  title: 'Grumpy Cat Mug',
  description: 'Start your day with a grumpy cat',
  price: 15.99,
  isHot: false,
  stock: 100,
  images: [],
  createdAt: '2026-02-02T00:00:00Z',
};

const mockPaginationMeta = {
  total: 25,
  page: 1,
  limit: 10,
  totalPages: 3,
};

describe('productService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getBySlug', () => {
    const mockProductDetail = {
      id: 'prod-1',
      title: 'Funny Cat Meme T-Shirt',
      slug: 'funny-cat',
      price: 24.99,
      compareAtPrice: 34.99,
      isHot: true,
      isActive: true,
      productType: { id: 'pt-1', name: 'T-Shirts', slug: 'tshirts', hasSizes: true },
      description: 'A great meme t-shirt',
      availableSizes: ['S', 'M', 'L'],
      color: 'white',
      images: [],
      reviews: [],
    };

    const mockDetailResponse = { data: mockProductDetail };

    it('should call GET /products/{slug}', async () => {
      mockApiClient.get.mockResolvedValueOnce({ data: mockDetailResponse });

      await productService.getBySlug('funny-cat');

      expect(mockApiClient.get).toHaveBeenCalledWith('/products/funny-cat');
    });

    it('should return ProductDetailResponse data', async () => {
      mockApiClient.get.mockResolvedValueOnce({ data: mockDetailResponse });

      const result = await productService.getBySlug('funny-cat');

      expect(result).toEqual(mockDetailResponse);
    });

    it('should propagate errors from apiClient', async () => {
      mockApiClient.get.mockRejectedValueOnce(
        new ApiException('NOT_FOUND', 'Product not found', 404)
      );

      await expect(productService.getBySlug('non-existent')).rejects.toThrow(ApiException);
    });
  });

  describe('list', () => {
    it('should call GET /products with empty params when none provided', async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: {
          data: [mockProduct, mockProduct2],
          meta: mockPaginationMeta,
        },
      });

      const result = await productService.list();

      expect(mockApiClient.get).toHaveBeenCalledWith('/products', { params: {} });
      expect(result).toEqual({
        data: [mockProduct, mockProduct2],
        meta: mockPaginationMeta,
      });
    });

    it('should pass all filter params as query parameters', async () => {
      const params = {
        page: 2,
        limit: 20,
        search: 'cat',
        typeSlug: 't-shirts',
        minPrice: 10,
        maxPrice: 50,
        isHot: true,
        sort: 'price_asc' as const,
      };

      mockApiClient.get.mockResolvedValueOnce({
        data: {
          data: [mockProduct],
          meta: { total: 1, page: 2, limit: 20, totalPages: 1 },
        },
      });

      const result = await productService.list(params);

      expect(mockApiClient.get).toHaveBeenCalledWith('/products', { params });
      expect(result.data).toEqual([mockProduct]);
      expect(result.meta).toEqual({ total: 1, page: 2, limit: 20, totalPages: 1 });
    });

    it('should return empty data with pagination meta when no products', async () => {
      const emptyMeta = {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      };

      mockApiClient.get.mockResolvedValueOnce({
        data: {
          data: [],
          meta: emptyMeta,
        },
      });

      const result = await productService.list();

      expect(result.data).toEqual([]);
      expect(result.meta).toEqual(emptyMeta);
    });

    it('should propagate errors on network failure', async () => {
      mockApiClient.get.mockRejectedValueOnce(
        new ApiException('NETWORK_ERROR', 'Unable to connect to server', 0)
      );

      await expect(productService.list()).rejects.toThrow(ApiException);
    });

    it('should omit undefined params from the request', async () => {
      const params = {
        search: 'cat',
        typeSlug: undefined,
        minPrice: undefined,
        maxPrice: 50,
        isHot: undefined,
        sort: undefined,
      };

      mockApiClient.get.mockResolvedValueOnce({
        data: {
          data: [mockProduct],
          meta: mockPaginationMeta,
        },
      });

      await productService.list(params);

      // Only defined params should be sent
      expect(mockApiClient.get).toHaveBeenCalledWith('/products', {
        params: { search: 'cat', maxPrice: 50 },
      });
    });
  });
});
