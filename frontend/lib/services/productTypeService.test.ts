import { productTypeService } from './productTypeService';
import { apiClient } from '../api/client';
import { ApiException } from '../api/exceptions';

// Mock apiClient
jest.mock('../api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

// Mock data
const mockProductType = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'T-Shirts',
  slug: 't-shirts',
  hasSizes: true,
  isActive: true,
  sortOrder: 1,
  productCount: 5,
};

const mockProductType2 = {
  id: '223e4567-e89b-12d3-a456-426614174001',
  name: 'Mugs',
  slug: 'mugs',
  hasSizes: false,
  isActive: false,
  sortOrder: 2,
  productCount: 3,
};

describe('productTypeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should call GET /product-types and return product types', async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: { data: [mockProductType, mockProductType2] },
      });

      const result = await productTypeService.getAll();

      expect(mockApiClient.get).toHaveBeenCalledWith('/product-types', { params: {} });
      expect(result).toEqual([mockProductType, mockProductType2]);
    });

    it('should pass isActive filter as query parameter', async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: { data: [mockProductType] },
      });

      const result = await productTypeService.getAll({ isActive: true });

      expect(mockApiClient.get).toHaveBeenCalledWith('/product-types', {
        params: { isActive: true },
      });
      expect(result).toEqual([mockProductType]);
    });

    it('should pass isActive=false filter as query parameter', async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: { data: [mockProductType2] },
      });

      const result = await productTypeService.getAll({ isActive: false });

      expect(mockApiClient.get).toHaveBeenCalledWith('/product-types', {
        params: { isActive: false },
      });
      expect(result).toEqual([mockProductType2]);
    });

    it('should return empty array when no product types exist', async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: { data: [] },
      });

      const result = await productTypeService.getAll();

      expect(result).toEqual([]);
    });

    it('should propagate ApiException on error', async () => {
      mockApiClient.get.mockRejectedValueOnce(
        new ApiException('NETWORK_ERROR', 'Unable to connect to server', 0)
      );

      await expect(productTypeService.getAll()).rejects.toThrow(ApiException);
    });
  });

  describe('create', () => {
    const createData = {
      name: { es: 'Camisetas', en: 'T-Shirts' },
      slug: 't-shirts',
      hasSizes: true,
      isActive: true,
      sortOrder: 1,
    };

    it('should call POST /product-types and return created product type', async () => {
      mockApiClient.post.mockResolvedValueOnce({
        data: { data: mockProductType },
      });

      const result = await productTypeService.create(createData);

      expect(mockApiClient.post).toHaveBeenCalledWith('/product-types', createData);
      expect(result).toEqual(mockProductType);
    });

    it('should propagate ApiException on validation error', async () => {
      mockApiClient.post.mockRejectedValueOnce(
        new ApiException('VALIDATION_ERROR', 'Slug already exists', 400)
      );

      await expect(productTypeService.create(createData)).rejects.toThrow(ApiException);
    });

    it('should propagate 401 when not authenticated', async () => {
      const error = new ApiException('UNAUTHORIZED', 'Authentication required', 401);
      mockApiClient.post.mockRejectedValueOnce(error);

      try {
        await productTypeService.create(createData);
        fail('Expected ApiException to be thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ApiException);
        expect((e as ApiException).status).toBe(401);
      }
    });

    it('should propagate 403 when user lacks admin role', async () => {
      const error = new ApiException('FORBIDDEN', 'Admin access required', 403);
      mockApiClient.post.mockRejectedValueOnce(error);

      try {
        await productTypeService.create(createData);
        fail('Expected ApiException to be thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ApiException);
        expect((e as ApiException).status).toBe(403);
      }
    });
  });

  describe('update', () => {
    const updateData = { name: { es: 'Camisetas Actualizadas', en: 'Updated T-Shirts' } };

    it('should call PATCH /product-types/:id and return updated product type', async () => {
      const updatedProductType = { ...mockProductType, name: 'Updated T-Shirts' };
      mockApiClient.patch.mockResolvedValueOnce({
        data: { data: updatedProductType },
      });

      const result = await productTypeService.update(mockProductType.id, updateData);

      expect(mockApiClient.patch).toHaveBeenCalledWith(
        `/product-types/${mockProductType.id}`,
        updateData
      );
      expect(result).toEqual(updatedProductType);
    });

    it('should propagate ApiException on not found', async () => {
      mockApiClient.patch.mockRejectedValueOnce(
        new ApiException('NOT_FOUND', 'Product type not found', 404)
      );

      await expect(
        productTypeService.update('nonexistent-id', { isActive: false })
      ).rejects.toThrow(ApiException);
    });

    it('should propagate 401 when not authenticated', async () => {
      const error = new ApiException('UNAUTHORIZED', 'Authentication required', 401);
      mockApiClient.patch.mockRejectedValueOnce(error);

      try {
        await productTypeService.update(mockProductType.id, { isActive: false });
        fail('Expected ApiException to be thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ApiException);
        expect((e as ApiException).status).toBe(401);
      }
    });

    it('should propagate 403 when user lacks admin role', async () => {
      const error = new ApiException('FORBIDDEN', 'Admin access required', 403);
      mockApiClient.patch.mockRejectedValueOnce(error);

      try {
        await productTypeService.update(mockProductType.id, { isActive: false });
        fail('Expected ApiException to be thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ApiException);
        expect((e as ApiException).status).toBe(403);
      }
    });
  });

  describe('delete', () => {
    it('should call DELETE /product-types/:id', async () => {
      mockApiClient.delete.mockResolvedValueOnce({ data: null, status: 204 });

      await productTypeService.delete(mockProductType.id);

      expect(mockApiClient.delete).toHaveBeenCalledWith(
        `/product-types/${mockProductType.id}`
      );
    });

    it('should return void on successful delete', async () => {
      mockApiClient.delete.mockResolvedValueOnce({ data: null, status: 204 });

      const result = await productTypeService.delete(mockProductType.id);

      expect(result).toBeUndefined();
    });

    it('should propagate ApiException on not found', async () => {
      mockApiClient.delete.mockRejectedValueOnce(
        new ApiException('NOT_FOUND', 'Product type not found', 404)
      );

      await expect(productTypeService.delete('nonexistent-id')).rejects.toThrow(ApiException);
    });

    it('should propagate ApiException on conflict', async () => {
      const error = new ApiException(
        'CONFLICT',
        'Cannot delete product type with associated products',
        409
      );
      mockApiClient.delete.mockRejectedValueOnce(error);

      try {
        await productTypeService.delete(mockProductType.id);
        fail('Expected ApiException to be thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ApiException);
        expect((e as ApiException).status).toBe(409);
        expect((e as ApiException).message).toContain('Cannot delete');
      }
    });

    it('should propagate 401 when not authenticated', async () => {
      const error = new ApiException('UNAUTHORIZED', 'Authentication required', 401);
      mockApiClient.delete.mockRejectedValueOnce(error);

      try {
        await productTypeService.delete(mockProductType.id);
        fail('Expected ApiException to be thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ApiException);
        expect((e as ApiException).status).toBe(401);
      }
    });

    it('should propagate 403 when user lacks admin role', async () => {
      const error = new ApiException('FORBIDDEN', 'Admin access required', 403);
      mockApiClient.delete.mockRejectedValueOnce(error);

      try {
        await productTypeService.delete(mockProductType.id);
        fail('Expected ApiException to be thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ApiException);
        expect((e as ApiException).status).toBe(403);
      }
    });
  });
});
