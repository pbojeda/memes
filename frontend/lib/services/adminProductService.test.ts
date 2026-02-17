import { adminProductService } from './adminProductService';
import { apiClient } from '../api/client';
import { ApiException } from '../api/exceptions';
import type { components } from '../api/types';

type Product = components['schemas']['Product'];
type ProductImage = components['schemas']['ProductImage'];
type ProductListResponse = components['schemas']['ProductListResponse'];
type CreateProductRequest = components['schemas']['CreateProductRequest'];
type UpdateProductRequest = components['schemas']['UpdateProductRequest'];
type CreateProductImageRequest = components['schemas']['CreateProductImageRequest'];
type UpdateProductImageRequest = components['schemas']['UpdateProductImageRequest'];

jest.mock('../api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

const mockProduct: Product = {
  id: 'prod-1',
  title: 'Test Product',
  slug: 'test-product',
  price: 24.99,
  isActive: true,
  isHot: false,
  createdAt: '2026-01-01T00:00:00Z',
  productType: { id: 'type-1', name: 'T-Shirts', slug: 't-shirts' },
  primaryImage: undefined,
  reviewsCount: 0,
  averageRating: 0,
};

const mockProductImage: ProductImage = {
  id: 'img-1',
  url: 'https://res.cloudinary.com/test/image/upload/v1/products/image-1.jpg',
  altText: 'Test image',
  isPrimary: false,
  sortOrder: 0,
};

const mockProductListResponse: ProductListResponse = {
  data: [mockProduct],
  meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
};

describe('adminProductService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('should call GET /products with no params when called with no arguments', async () => {
      mockApiClient.get.mockResolvedValueOnce({ data: mockProductListResponse });

      await adminProductService.list();

      expect(mockApiClient.get).toHaveBeenCalledWith('/products', { params: {} });
    });

    it('should call GET /products with { isActive: true } when isActive: true is passed', async () => {
      mockApiClient.get.mockResolvedValueOnce({ data: mockProductListResponse });

      await adminProductService.list({ isActive: true });

      expect(mockApiClient.get).toHaveBeenCalledWith('/products', {
        params: { isActive: true },
      });
    });

    it('should call GET /products with { isActive: false } when isActive: false is passed', async () => {
      mockApiClient.get.mockResolvedValueOnce({ data: mockProductListResponse });

      await adminProductService.list({ isActive: false });

      expect(mockApiClient.get).toHaveBeenCalledWith('/products', {
        params: { isActive: false },
      });
    });

    it('should call GET /products with { search: "cat" } when search: "cat" is passed', async () => {
      mockApiClient.get.mockResolvedValueOnce({ data: mockProductListResponse });

      await adminProductService.list({ search: 'cat' });

      expect(mockApiClient.get).toHaveBeenCalledWith('/products', {
        params: { search: 'cat' },
      });
    });

    it('should call GET /products with combined params (page, limit, search, isActive)', async () => {
      mockApiClient.get.mockResolvedValueOnce({ data: mockProductListResponse });

      await adminProductService.list({ page: 2, limit: 20, search: 'cat', isActive: true });

      expect(mockApiClient.get).toHaveBeenCalledWith('/products', {
        params: { page: 2, limit: 20, search: 'cat', isActive: true },
      });
    });

    it('should strip undefined values from params', async () => {
      mockApiClient.get.mockResolvedValueOnce({ data: mockProductListResponse });

      await adminProductService.list({ search: undefined, page: 1 });

      expect(mockApiClient.get).toHaveBeenCalledWith('/products', {
        params: { page: 1 },
      });
    });

    it('should return the full ProductListResponse', async () => {
      mockApiClient.get.mockResolvedValueOnce({ data: mockProductListResponse });

      const result = await adminProductService.list();

      expect(result).toEqual(mockProductListResponse);
    });

    it('should propagate ApiException on error', async () => {
      mockApiClient.get.mockRejectedValueOnce(
        new ApiException('NETWORK_ERROR', 'Unable to connect to server', 0)
      );

      await expect(adminProductService.list()).rejects.toThrow(ApiException);
    });
  });

  describe('activate', () => {
    it('should call POST /products/{productId}/activate with the correct product ID', async () => {
      mockApiClient.post.mockResolvedValueOnce({ data: { data: mockProduct } });

      await adminProductService.activate('prod-1');

      expect(mockApiClient.post).toHaveBeenCalledWith('/products/prod-1/activate');
    });

    it('should return the Product from response data', async () => {
      mockApiClient.post.mockResolvedValueOnce({ data: { data: mockProduct } });

      const result = await adminProductService.activate('prod-1');

      expect(result).toEqual(mockProduct);
    });

    it('should propagate ApiException on 401', async () => {
      mockApiClient.post.mockRejectedValueOnce(
        new ApiException('UNAUTHORIZED', 'Authentication required', 401)
      );

      try {
        await adminProductService.activate('prod-1');
        fail('Expected ApiException to be thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ApiException);
        expect((e as ApiException).status).toBe(401);
      }
    });

    it('should propagate ApiException on 403', async () => {
      mockApiClient.post.mockRejectedValueOnce(
        new ApiException('FORBIDDEN', 'Admin access required', 403)
      );

      try {
        await adminProductService.activate('prod-1');
        fail('Expected ApiException to be thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ApiException);
        expect((e as ApiException).status).toBe(403);
      }
    });

    it('should propagate ApiException on 404', async () => {
      mockApiClient.post.mockRejectedValueOnce(
        new ApiException('NOT_FOUND', 'Product not found', 404)
      );

      await expect(adminProductService.activate('nonexistent')).rejects.toThrow(ApiException);
    });
  });

  describe('deactivate', () => {
    it('should call POST /products/{productId}/deactivate with the correct product ID', async () => {
      mockApiClient.post.mockResolvedValueOnce({ data: { data: { ...mockProduct, isActive: false } } });

      await adminProductService.deactivate('prod-1');

      expect(mockApiClient.post).toHaveBeenCalledWith('/products/prod-1/deactivate');
    });

    it('should return the Product from response data', async () => {
      const inactiveProduct = { ...mockProduct, isActive: false };
      mockApiClient.post.mockResolvedValueOnce({ data: { data: inactiveProduct } });

      const result = await adminProductService.deactivate('prod-1');

      expect(result).toEqual(inactiveProduct);
    });

    it('should propagate ApiException on 401/403/404', async () => {
      mockApiClient.post.mockRejectedValueOnce(
        new ApiException('UNAUTHORIZED', 'Authentication required', 401)
      );

      await expect(adminProductService.deactivate('prod-1')).rejects.toThrow(ApiException);
    });
  });

  describe('delete', () => {
    it('should call DELETE /products/{productId} with the correct product ID', async () => {
      mockApiClient.delete.mockResolvedValueOnce({ data: null, status: 204 });

      await adminProductService.delete('prod-1');

      expect(mockApiClient.delete).toHaveBeenCalledWith('/products/prod-1');
    });

    it('should return void (204 response has no body)', async () => {
      mockApiClient.delete.mockResolvedValueOnce({ data: null, status: 204 });

      const result = await adminProductService.delete('prod-1');

      expect(result).toBeUndefined();
    });

    it('should propagate ApiException on 401', async () => {
      mockApiClient.delete.mockRejectedValueOnce(
        new ApiException('UNAUTHORIZED', 'Authentication required', 401)
      );

      try {
        await adminProductService.delete('prod-1');
        fail('Expected ApiException to be thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ApiException);
        expect((e as ApiException).status).toBe(401);
      }
    });

    it('should propagate ApiException on 403', async () => {
      mockApiClient.delete.mockRejectedValueOnce(
        new ApiException('FORBIDDEN', 'Admin access required', 403)
      );

      try {
        await adminProductService.delete('prod-1');
        fail('Expected ApiException to be thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ApiException);
        expect((e as ApiException).status).toBe(403);
      }
    });

    it('should propagate ApiException on 404', async () => {
      mockApiClient.delete.mockRejectedValueOnce(
        new ApiException('NOT_FOUND', 'Product not found', 404)
      );

      await expect(adminProductService.delete('nonexistent')).rejects.toThrow(ApiException);
    });
  });

  describe('getById', () => {
    it('should call GET /products/{productId}', async () => {
      mockApiClient.get.mockResolvedValueOnce({ data: { data: mockProduct } });

      await adminProductService.getById('prod-1');

      expect(mockApiClient.get).toHaveBeenCalledWith('/products/prod-1');
    });

    it('should return the Product from response data', async () => {
      mockApiClient.get.mockResolvedValueOnce({ data: { data: mockProduct } });

      const result = await adminProductService.getById('prod-1');

      expect(result).toEqual(mockProduct);
    });

    it('should propagate ApiException on 404', async () => {
      mockApiClient.get.mockRejectedValueOnce(
        new ApiException('NOT_FOUND', 'Product not found', 404)
      );

      await expect(adminProductService.getById('nonexistent')).rejects.toThrow(ApiException);
    });
  });

  describe('create', () => {
    const createData: CreateProductRequest = {
      productTypeId: 'type-1',
      title: { es: 'Producto Test' },
      description: { es: 'Descripción test' },
      price: 29.99,
      color: 'white',
      isActive: true,
      isHot: false,
    };

    it('should call POST /products with the request body', async () => {
      mockApiClient.post.mockResolvedValueOnce({ data: { data: mockProduct } });

      await adminProductService.create(createData);

      expect(mockApiClient.post).toHaveBeenCalledWith('/products', createData);
    });

    it('should return the Product from response data', async () => {
      mockApiClient.post.mockResolvedValueOnce({ data: { data: mockProduct } });

      const result = await adminProductService.create(createData);

      expect(result).toEqual(mockProduct);
    });

    it('should propagate ApiException on 400', async () => {
      mockApiClient.post.mockRejectedValueOnce(
        new ApiException('VALIDATION_ERROR', 'Invalid data', 400)
      );

      await expect(adminProductService.create(createData)).rejects.toThrow(ApiException);
    });
  });

  describe('update', () => {
    const updateData: UpdateProductRequest = {
      title: { es: 'Updated Title' },
      price: 39.99,
      priceChangeReason: 'Price increase',
    };

    it('should call PATCH /products/{productId} with the request body', async () => {
      mockApiClient.patch.mockResolvedValueOnce({ data: { data: mockProduct } });

      await adminProductService.update('prod-1', updateData);

      expect(mockApiClient.patch).toHaveBeenCalledWith('/products/prod-1', updateData);
    });

    it('should return the Product from response data', async () => {
      mockApiClient.patch.mockResolvedValueOnce({ data: { data: mockProduct } });

      const result = await adminProductService.update('prod-1', updateData);

      expect(result).toEqual(mockProduct);
    });

    it('should propagate ApiException on 404', async () => {
      mockApiClient.patch.mockRejectedValueOnce(
        new ApiException('NOT_FOUND', 'Product not found', 404)
      );

      await expect(adminProductService.update('nonexistent', updateData)).rejects.toThrow(ApiException);
    });
  });

  describe('listImages', () => {
    it('should call GET /products/{productId}/images', async () => {
      mockApiClient.get.mockResolvedValueOnce({ data: { data: [mockProductImage] } });

      await adminProductService.listImages('prod-1');

      expect(mockApiClient.get).toHaveBeenCalledWith('/products/prod-1/images');
    });

    it('should return the ProductImage array from response data', async () => {
      mockApiClient.get.mockResolvedValueOnce({ data: { data: [mockProductImage] } });

      const result = await adminProductService.listImages('prod-1');

      expect(result).toEqual([mockProductImage]);
    });
  });

  describe('addImage', () => {
    const imageData: CreateProductImageRequest = {
      url: 'https://example.com/image.jpg',
      isPrimary: false,
      sortOrder: 1,
    };

    it('should call POST /products/{productId}/images with the image data', async () => {
      mockApiClient.post.mockResolvedValueOnce({ data: { data: mockProductImage } });

      await adminProductService.addImage('prod-1', imageData);

      expect(mockApiClient.post).toHaveBeenCalledWith('/products/prod-1/images', imageData);
    });

    it('should return the ProductImage from response data', async () => {
      mockApiClient.post.mockResolvedValueOnce({ data: { data: mockProductImage } });

      const result = await adminProductService.addImage('prod-1', imageData);

      expect(result).toEqual(mockProductImage);
    });
  });

  describe('updateImage', () => {
    const updateImageData: UpdateProductImageRequest = {
      isPrimary: true,
    };

    it('should call PATCH /products/{productId}/images/{imageId} with the update data', async () => {
      mockApiClient.patch.mockResolvedValueOnce({ data: { data: { ...mockProductImage, isPrimary: true } } });

      await adminProductService.updateImage('prod-1', 'img-1', updateImageData);

      expect(mockApiClient.patch).toHaveBeenCalledWith('/products/prod-1/images/img-1', updateImageData);
    });

    it('should return the ProductImage from response data', async () => {
      const updatedImage = { ...mockProductImage, isPrimary: true };
      mockApiClient.patch.mockResolvedValueOnce({ data: { data: updatedImage } });

      const result = await adminProductService.updateImage('prod-1', 'img-1', updateImageData);

      expect(result).toEqual(updatedImage);
    });
  });

  describe('deleteImage', () => {
    it('should call DELETE /products/{productId}/images/{imageId}', async () => {
      mockApiClient.delete.mockResolvedValueOnce({ data: null, status: 204 });

      await adminProductService.deleteImage('prod-1', 'img-1');

      expect(mockApiClient.delete).toHaveBeenCalledWith('/products/prod-1/images/img-1');
    });

    it('should return void', async () => {
      mockApiClient.delete.mockResolvedValueOnce({ data: null, status: 204 });

      const result = await adminProductService.deleteImage('prod-1', 'img-1');

      expect(result).toBeUndefined();
    });
  });
});
