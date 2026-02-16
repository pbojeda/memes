import request from 'supertest';
import express from 'express';
import * as tokenService from '../application/services/tokenService';
import * as productService from '../application/services/productService';
import { UserRole } from '../generated/prisma/enums';
import { Prisma } from '../generated/prisma/client';
import type { Product } from '../generated/prisma/client';
import {
  InvalidProductDataError,
  ProductNotFoundError,
  ProductSlugAlreadyExistsError,
} from '../domain/errors/ProductError';

// Mock dependencies
jest.mock('../application/services/tokenService', () => ({
  generateAccessToken: jest.fn(),
  generateRefreshToken: jest.fn(),
  verifyAccessToken: jest.fn(),
  refreshTokens: jest.fn(),
}));

jest.mock('../application/services/productService', () => ({
  createProduct: jest.fn(),
  getProductById: jest.fn(),
  getProductBySlug: jest.fn(),
  updateProduct: jest.fn(),
  softDeleteProduct: jest.fn(),
  restoreProduct: jest.fn(),
  listProducts: jest.fn(),
  getProductDetailBySlug: jest.fn(),
}));

const mockTokenService = tokenService as jest.Mocked<typeof tokenService>;
const mockProductService = productService as jest.Mocked<typeof productService>;

// Create test app with routes
const createTestApp = () => {
  const testApp = express();
  testApp.use(express.json());
  const routes = require('./index').default;
  testApp.use(routes);
  return testApp;
};

const testApp = createTestApp();

// Helper to set up admin auth
const setupAdminAuth = () => {
  (mockTokenService.verifyAccessToken as jest.Mock).mockReturnValue({
    userId: 'admin-123',
    email: 'admin@example.com',
    role: UserRole.ADMIN,
  });
};

// Helper to set up role-based auth
const setupRoleAuth = (role: UserRole) => {
  (mockTokenService.verifyAccessToken as jest.Mock).mockReturnValue({
    userId: `user-${role.toLowerCase()}-123`,
    email: `${role.toLowerCase()}@example.com`,
    role,
  });
};

describe('Product Routes Integration', () => {
  const mockProduct: Product = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: { es: 'Camiseta Test', en: 'Test T-Shirt' },
    description: { es: 'Una camiseta de prueba' },
    slug: 'camiseta-test',
    price: new Prisma.Decimal(29.99),
    compareAtPrice: null,
    availableSizes: ['S', 'M', 'L'],
    productTypeId: '123e4567-e89b-12d3-a456-426614174001',
    color: 'Rojo',
    isActive: true,
    isHot: true,
    printfulProductId: null,
    printfulSyncVariantId: null,
    memeSourceUrl: null,
    memeIsOriginal: false,
    salesCount: 50,
    viewCount: 200,
    createdByUserId: null,
    deletedAt: null,
    createdAt: new Date('2026-02-10'),
    updatedAt: new Date('2026-02-10'),
  };

  const mockProductWithDetails = {
    ...mockProduct,
    images: [
      {
        id: 'img-123',
        productId: mockProduct.id,
        imageUrl: 'https://example.com/image.jpg',
        altText: 'Test image',
        sortOrder: 1,
        createdAt: new Date('2026-02-10'),
        updatedAt: new Date('2026-02-10'),
      },
    ],
    reviews: [
      {
        id: 'review-123',
        productId: mockProduct.id,
        rating: 5,
        comment: 'Great product!',
        isVisible: true,
        createdByUserId: 'user-123',
        createdAt: new Date('2026-02-10'),
        updatedAt: new Date('2026-02-10'),
      },
    ],
  };

  const mockProductSoftDeleted: Product = {
    ...mockProduct,
    id: '123e4567-e89b-12d3-a456-426614174002',
    slug: 'deleted-product',
    deletedAt: new Date('2026-02-15'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /products', () => {
    const mockListResult = {
      data: [mockProduct],
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    };

    it('should return 200 with products list and pagination for unauthenticated users', async () => {
      (mockProductService.listProducts as jest.Mock).mockResolvedValue(mockListResult);

      const response = await request(testApp).get('/products');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].slug).toBe('camiseta-test');
      expect(response.body.pagination).toEqual(mockListResult.pagination);
    });

    it('should call listProducts with correct default params', async () => {
      (mockProductService.listProducts as jest.Mock).mockResolvedValue(mockListResult);

      await request(testApp).get('/products');

      expect(mockProductService.listProducts).toHaveBeenCalledWith({});
    });

    it('should call listProducts with parsed query parameters (correct types)', async () => {
      (mockProductService.listProducts as jest.Mock).mockResolvedValue(mockListResult);

      await request(testApp).get(
        '/products?page=2&limit=10&search=test&productTypeId=pt-123&isActive=true&isHot=false&minPrice=10&maxPrice=50&sortBy=price&sortDirection=asc'
      );

      const callArgs = (mockProductService.listProducts as jest.Mock).mock.calls[0][0];

      // Verify numeric types (not strings)
      expect(typeof callArgs.page).toBe('number');
      expect(typeof callArgs.limit).toBe('number');
      expect(typeof callArgs.minPrice).toBe('number');
      expect(typeof callArgs.maxPrice).toBe('number');

      // Verify boolean types (not strings)
      expect(typeof callArgs.isActive).toBe('boolean');
      expect(typeof callArgs.isHot).toBe('boolean');

      // Verify exact values
      expect(callArgs).toEqual({
        page: 2,
        limit: 10,
        search: 'test',
        productTypeId: 'pt-123',
        isActive: true,
        isHot: false,
        minPrice: 10,
        maxPrice: 50,
        sortBy: 'price',
        sortDirection: 'asc',
      });
    });

    it('should ignore includeSoftDeleted for unauthenticated users', async () => {
      (mockProductService.listProducts as jest.Mock).mockResolvedValue(mockListResult);

      await request(testApp).get('/products?includeSoftDeleted=true');

      expect(mockProductService.listProducts).toHaveBeenCalledWith({});
    });

    it('should ignore includeSoftDeleted for TARGET users', async () => {
      setupRoleAuth(UserRole.TARGET);
      (mockProductService.listProducts as jest.Mock).mockResolvedValue(mockListResult);

      await request(testApp)
        .get('/products?includeSoftDeleted=true')
        .set('Authorization', 'Bearer valid-token');

      expect(mockProductService.listProducts).toHaveBeenCalledWith({});
    });

    it('should allow includeSoftDeleted for MANAGER users', async () => {
      setupRoleAuth(UserRole.MANAGER);
      (mockProductService.listProducts as jest.Mock).mockResolvedValue(mockListResult);

      await request(testApp)
        .get('/products?includeSoftDeleted=true')
        .set('Authorization', 'Bearer valid-token');

      expect(mockProductService.listProducts).toHaveBeenCalledWith({
        includeSoftDeleted: true,
      });
    });

    it('should allow includeSoftDeleted for ADMIN users', async () => {
      setupAdminAuth();
      (mockProductService.listProducts as jest.Mock).mockResolvedValue(mockListResult);

      await request(testApp)
        .get('/products?includeSoftDeleted=true')
        .set('Authorization', 'Bearer valid-token');

      expect(mockProductService.listProducts).toHaveBeenCalledWith({
        includeSoftDeleted: true,
      });
    });

    it('should return 400 for invalid filters', async () => {
      (mockProductService.listProducts as jest.Mock).mockRejectedValue(
        new InvalidProductDataError('Invalid page number', 'page')
      );

      const response = await request(testApp).get('/products?page=-1');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_PRODUCT_DATA');
    });

    it('should silently ignore invalid auth tokens and treat as unauthenticated', async () => {
      (mockTokenService.verifyAccessToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });
      (mockProductService.listProducts as jest.Mock).mockResolvedValue(mockListResult);

      const response = await request(testApp)
        .get('/products?includeSoftDeleted=true')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(200);
      expect(mockProductService.listProducts).toHaveBeenCalledWith({});
    });
  });

  describe('GET /products/:slug (public)', () => {
    it('should return 200 with product detail for valid slug', async () => {
      (mockProductService.getProductDetailBySlug as jest.Mock).mockResolvedValue(
        mockProductWithDetails
      );

      const response = await request(testApp).get('/products/camiseta-test');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.slug).toBe('camiseta-test');
      expect(response.body.data.images).toHaveLength(1);
      expect(response.body.data.reviews).toHaveLength(1);
    });

    it('should return 404 when product not found', async () => {
      (mockProductService.getProductDetailBySlug as jest.Mock).mockRejectedValue(
        new ProductNotFoundError()
      );

      const response = await request(testApp).get('/products/non-existent-slug');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PRODUCT_NOT_FOUND');
    });

    it('should silently ignore invalid auth tokens and treat as unauthenticated', async () => {
      (mockTokenService.verifyAccessToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });
      (mockProductService.getProductDetailBySlug as jest.Mock).mockResolvedValue(
        mockProductWithDetails
      );

      const response = await request(testApp)
        .get('/products/camiseta-test')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(200);
      expect(mockProductService.getProductDetailBySlug).toHaveBeenCalledWith('camiseta-test');
    });
  });

  describe('GET /products/:id (admin via UUID)', () => {
    const validUUID = '123e4567-e89b-12d3-a456-426614174000';

    it('should return 200 for MANAGER with product data', async () => {
      setupRoleAuth(UserRole.MANAGER);
      (mockProductService.getProductById as jest.Mock).mockResolvedValue(mockProduct);

      const response = await request(testApp)
        .get(`/products/${validUUID}`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(validUUID);
      expect(mockProductService.getProductById).toHaveBeenCalledWith(validUUID, true);
    });

    it('should return 200 for ADMIN with product data', async () => {
      setupAdminAuth();
      (mockProductService.getProductById as jest.Mock).mockResolvedValue(mockProduct);

      const response = await request(testApp)
        .get(`/products/${validUUID}`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(validUUID);
      expect(mockProductService.getProductById).toHaveBeenCalledWith(validUUID, true);
    });

    it('should return 403 for TARGET user', async () => {
      setupRoleAuth(UserRole.TARGET);

      const response = await request(testApp)
        .get(`/products/${validUUID}`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
      expect(response.body.error.message).toBe('Insufficient permissions');
    });

    it('should return 403 for MARKETING user', async () => {
      setupRoleAuth(UserRole.MARKETING);

      const response = await request(testApp)
        .get(`/products/${validUUID}`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should return 403 for unauthenticated user accessing UUID', async () => {
      const response = await request(testApp).get(`/products/${validUUID}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should return 404 when product not found', async () => {
      setupAdminAuth();
      (mockProductService.getProductById as jest.Mock).mockRejectedValue(
        new ProductNotFoundError()
      );

      const response = await request(testApp)
        .get(`/products/${validUUID}`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PRODUCT_NOT_FOUND');
    });

    it('should include soft-deleted products for admin UUID access', async () => {
      setupAdminAuth();
      (mockProductService.getProductById as jest.Mock).mockResolvedValue(mockProductSoftDeleted);

      const response = await request(testApp)
        .get(`/products/${mockProductSoftDeleted.id}`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.data.deletedAt).toBeTruthy();
      expect(mockProductService.getProductById).toHaveBeenCalledWith(
        mockProductSoftDeleted.id,
        true
      );
    });
  });

  describe('POST /products', () => {
    const createPayload = {
      title: { es: 'Nueva Camiseta', en: 'New T-Shirt' },
      description: { es: 'Descripción de la camiseta' },
      slug: 'nueva-camiseta',
      price: 39.99,
      availableSizes: ['S', 'M', 'L'],
      productTypeId: 'pt-123',
      color: 'Azul',
      isActive: true,
      isHot: false,
    };

    it('should return 201 on successful creation by MANAGER', async () => {
      setupRoleAuth(UserRole.MANAGER);
      const createdProduct = { ...mockProduct, ...createPayload, id: 'new-product-123' };
      (mockProductService.createProduct as jest.Mock).mockResolvedValue(createdProduct);

      const response = await request(testApp)
        .post('/products')
        .set('Authorization', 'Bearer valid-token')
        .send(createPayload);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.slug).toBe('nueva-camiseta');
      expect(mockProductService.createProduct).toHaveBeenCalledWith({
        ...createPayload,
        createdByUserId: 'user-manager-123',
      });
    });

    it('should return 201 on successful creation by ADMIN', async () => {
      setupAdminAuth();
      const createdProduct = { ...mockProduct, ...createPayload, id: 'new-product-123' };
      (mockProductService.createProduct as jest.Mock).mockResolvedValue(createdProduct);

      const response = await request(testApp)
        .post('/products')
        .set('Authorization', 'Bearer valid-token')
        .send(createPayload);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(mockProductService.createProduct).toHaveBeenCalledWith({
        ...createPayload,
        createdByUserId: 'admin-123',
      });
    });

    it('should return 401 when no token provided', async () => {
      const response = await request(testApp).post('/products').send(createPayload);

      expect(response.status).toBe(401);
    });

    it('should return 403 for TARGET user', async () => {
      setupRoleAuth(UserRole.TARGET);

      const response = await request(testApp)
        .post('/products')
        .set('Authorization', 'Bearer valid-token')
        .send(createPayload);

      expect(response.status).toBe(403);
    });

    it('should return 403 for MARKETING user', async () => {
      setupRoleAuth(UserRole.MARKETING);

      const response = await request(testApp)
        .post('/products')
        .set('Authorization', 'Bearer valid-token')
        .send(createPayload);

      expect(response.status).toBe(403);
    });

    it('should return 400 for validation error', async () => {
      setupAdminAuth();
      (mockProductService.createProduct as jest.Mock).mockRejectedValue(
        new InvalidProductDataError('Invalid slug format', 'slug')
      );

      const response = await request(testApp)
        .post('/products')
        .set('Authorization', 'Bearer valid-token')
        .send({ ...createPayload, slug: 'INVALID SLUG!' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_PRODUCT_DATA');
      expect(response.body.error.field).toBe('slug');
    });

    it('should return 409 for duplicate slug', async () => {
      setupAdminAuth();
      (mockProductService.createProduct as jest.Mock).mockRejectedValue(
        new ProductSlugAlreadyExistsError()
      );

      const response = await request(testApp)
        .post('/products')
        .set('Authorization', 'Bearer valid-token')
        .send(createPayload);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PRODUCT_SLUG_ALREADY_EXISTS');
    });

    it('should return 400 for missing required fields', async () => {
      setupAdminAuth();
      (mockProductService.createProduct as jest.Mock).mockRejectedValue(
        new InvalidProductDataError('Title is required', 'title')
      );

      const response = await request(testApp)
        .post('/products')
        .set('Authorization', 'Bearer valid-token')
        .send({ slug: 'test' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_PRODUCT_DATA');
    });
  });

  describe('PATCH /products/:id', () => {
    const validId = '123e4567-e89b-12d3-a456-426614174000';
    const updatePayload = {
      title: { es: 'Camiseta Actualizada', en: 'Updated T-Shirt' },
      price: 34.99,
    };

    it('should return 200 on successful update by MANAGER', async () => {
      setupRoleAuth(UserRole.MANAGER);
      const updatedProduct = { ...mockProduct, ...updatePayload };
      (mockProductService.updateProduct as jest.Mock).mockResolvedValue(updatedProduct);

      const response = await request(testApp)
        .patch(`/products/${validId}`)
        .set('Authorization', 'Bearer valid-token')
        .send(updatePayload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title.es).toBe('Camiseta Actualizada');
      expect(mockProductService.updateProduct).toHaveBeenCalledWith(
        validId,
        updatePayload,
        'user-manager-123',
        undefined
      );
    });

    it('should return 200 on successful update by ADMIN', async () => {
      setupAdminAuth();
      const updatedProduct = { ...mockProduct, ...updatePayload };
      (mockProductService.updateProduct as jest.Mock).mockResolvedValue(updatedProduct);

      const response = await request(testApp)
        .patch(`/products/${validId}`)
        .set('Authorization', 'Bearer valid-token')
        .send(updatePayload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockProductService.updateProduct).toHaveBeenCalledWith(
        validId,
        updatePayload,
        'admin-123',
        undefined
      );
    });

    it('should pass priceChangeReason separately when provided', async () => {
      setupAdminAuth();
      const updatedProduct = { ...mockProduct, price: new Prisma.Decimal(34.99) };
      (mockProductService.updateProduct as jest.Mock).mockResolvedValue(updatedProduct);

      const response = await request(testApp)
        .patch(`/products/${validId}`)
        .set('Authorization', 'Bearer valid-token')
        .send({ price: 34.99, priceChangeReason: 'Seasonal discount' });

      expect(response.status).toBe(200);
      expect(mockProductService.updateProduct).toHaveBeenCalledWith(
        validId,
        { price: 34.99 },
        'admin-123',
        'Seasonal discount'
      );
    });

    it('should return 401 when no token provided', async () => {
      const response = await request(testApp).patch(`/products/${validId}`).send(updatePayload);

      expect(response.status).toBe(401);
    });

    it('should return 403 for TARGET user', async () => {
      setupRoleAuth(UserRole.TARGET);

      const response = await request(testApp)
        .patch(`/products/${validId}`)
        .set('Authorization', 'Bearer valid-token')
        .send(updatePayload);

      expect(response.status).toBe(403);
    });

    it('should return 400 for validation error', async () => {
      setupAdminAuth();
      (mockProductService.updateProduct as jest.Mock).mockRejectedValue(
        new InvalidProductDataError('Invalid price', 'price')
      );

      const response = await request(testApp)
        .patch(`/products/${validId}`)
        .set('Authorization', 'Bearer valid-token')
        .send({ price: -10 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_PRODUCT_DATA');
    });

    it('should return 404 when product not found', async () => {
      setupAdminAuth();
      (mockProductService.updateProduct as jest.Mock).mockRejectedValue(new ProductNotFoundError());

      const response = await request(testApp)
        .patch(`/products/${validId}`)
        .set('Authorization', 'Bearer valid-token')
        .send(updatePayload);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PRODUCT_NOT_FOUND');
    });

    it('should return 409 for duplicate slug', async () => {
      setupAdminAuth();
      (mockProductService.updateProduct as jest.Mock).mockRejectedValue(
        new ProductSlugAlreadyExistsError()
      );

      const response = await request(testApp)
        .patch(`/products/${validId}`)
        .set('Authorization', 'Bearer valid-token')
        .send({ slug: 'existing-slug' });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PRODUCT_SLUG_ALREADY_EXISTS');
    });
  });

  describe('DELETE /products/:id', () => {
    const validId = '123e4567-e89b-12d3-a456-426614174000';

    it('should return 204 on successful soft delete by ADMIN', async () => {
      setupAdminAuth();
      (mockProductService.softDeleteProduct as jest.Mock).mockResolvedValue(undefined);

      const response = await request(testApp)
        .delete(`/products/${validId}`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(204);
      expect(mockProductService.softDeleteProduct).toHaveBeenCalledWith(validId);
    });

    it('should return 204 on successful soft delete by MANAGER', async () => {
      setupRoleAuth(UserRole.MANAGER);
      (mockProductService.softDeleteProduct as jest.Mock).mockResolvedValue(undefined);

      const response = await request(testApp)
        .delete(`/products/${validId}`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(204);
    });

    it('should return 401 when no token provided', async () => {
      const response = await request(testApp).delete(`/products/${validId}`);

      expect(response.status).toBe(401);
    });

    it('should return 403 for TARGET user', async () => {
      setupRoleAuth(UserRole.TARGET);

      const response = await request(testApp)
        .delete(`/products/${validId}`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(403);
    });

    it('should return 403 for MARKETING user', async () => {
      setupRoleAuth(UserRole.MARKETING);

      const response = await request(testApp)
        .delete(`/products/${validId}`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(403);
    });

    it('should return 400 for invalid UUID', async () => {
      setupAdminAuth();
      (mockProductService.softDeleteProduct as jest.Mock).mockRejectedValue(
        new InvalidProductDataError('Invalid product ID', 'id')
      );

      const response = await request(testApp)
        .delete('/products/not-a-uuid')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_PRODUCT_DATA');
    });

    it('should return 404 when product not found', async () => {
      setupAdminAuth();
      (mockProductService.softDeleteProduct as jest.Mock).mockRejectedValue(
        new ProductNotFoundError()
      );

      const response = await request(testApp)
        .delete(`/products/${validId}`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PRODUCT_NOT_FOUND');
    });
  });

  describe('POST /products/:id/restore', () => {
    const validId = '123e4567-e89b-12d3-a456-426614174000';

    it('should return 200 on successful restore by ADMIN', async () => {
      setupAdminAuth();
      const restoredProduct = { ...mockProduct, deletedAt: null };
      (mockProductService.restoreProduct as jest.Mock).mockResolvedValue(restoredProduct);

      const response = await request(testApp)
        .post(`/products/${validId}/restore`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.deletedAt).toBeNull();
      expect(mockProductService.restoreProduct).toHaveBeenCalledWith(validId);
    });

    it('should return 200 on successful restore by MANAGER', async () => {
      setupRoleAuth(UserRole.MANAGER);
      const restoredProduct = { ...mockProduct, deletedAt: null };
      (mockProductService.restoreProduct as jest.Mock).mockResolvedValue(restoredProduct);

      const response = await request(testApp)
        .post(`/products/${validId}/restore`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 401 when no token provided', async () => {
      const response = await request(testApp).post(`/products/${validId}/restore`);

      expect(response.status).toBe(401);
    });

    it('should return 403 for TARGET user', async () => {
      setupRoleAuth(UserRole.TARGET);

      const response = await request(testApp)
        .post(`/products/${validId}/restore`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(403);
    });

    it('should return 403 for MARKETING user', async () => {
      setupRoleAuth(UserRole.MARKETING);

      const response = await request(testApp)
        .post(`/products/${validId}/restore`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(403);
    });

    it('should return 404 when product not found', async () => {
      setupAdminAuth();
      (mockProductService.restoreProduct as jest.Mock).mockRejectedValue(
        new ProductNotFoundError()
      );

      const response = await request(testApp)
        .post(`/products/${validId}/restore`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PRODUCT_NOT_FOUND');
    });

    it('should return 400 for invalid UUID', async () => {
      setupAdminAuth();
      (mockProductService.restoreProduct as jest.Mock).mockRejectedValue(
        new InvalidProductDataError('Invalid product ID', 'id')
      );

      const response = await request(testApp)
        .post('/products/not-a-uuid/restore')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_PRODUCT_DATA');
    });
  });

  describe('POST /products/:id/activate', () => {
    const validId = '123e4567-e89b-12d3-a456-426614174000';

    it('should return 200 on successful activation by ADMIN', async () => {
      setupAdminAuth();
      const activatedProduct = { ...mockProduct, isActive: true };
      (mockProductService.updateProduct as jest.Mock).mockResolvedValue(activatedProduct);

      const response = await request(testApp)
        .post(`/products/${validId}/activate`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isActive).toBe(true);
      expect(mockProductService.updateProduct).toHaveBeenCalledWith(
        validId,
        { isActive: true },
        'admin-123'
      );
    });

    it('should return 200 on successful activation by MANAGER', async () => {
      setupRoleAuth(UserRole.MANAGER);
      const activatedProduct = { ...mockProduct, isActive: true };
      (mockProductService.updateProduct as jest.Mock).mockResolvedValue(activatedProduct);

      const response = await request(testApp)
        .post(`/products/${validId}/activate`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockProductService.updateProduct).toHaveBeenCalledWith(
        validId,
        { isActive: true },
        'user-manager-123'
      );
    });

    it('should return 401 when no token provided', async () => {
      const response = await request(testApp).post(`/products/${validId}/activate`);

      expect(response.status).toBe(401);
    });

    it('should return 403 for TARGET user', async () => {
      setupRoleAuth(UserRole.TARGET);

      const response = await request(testApp)
        .post(`/products/${validId}/activate`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(403);
    });

    it('should return 403 for MARKETING user', async () => {
      setupRoleAuth(UserRole.MARKETING);

      const response = await request(testApp)
        .post(`/products/${validId}/activate`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(403);
    });

    it('should return 404 when product not found', async () => {
      setupAdminAuth();
      (mockProductService.updateProduct as jest.Mock).mockRejectedValue(new ProductNotFoundError());

      const response = await request(testApp)
        .post(`/products/${validId}/activate`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PRODUCT_NOT_FOUND');
    });
  });

  describe('POST /products/:id/deactivate', () => {
    const validId = '123e4567-e89b-12d3-a456-426614174000';

    it('should return 200 on successful deactivation by ADMIN', async () => {
      setupAdminAuth();
      const deactivatedProduct = { ...mockProduct, isActive: false };
      (mockProductService.updateProduct as jest.Mock).mockResolvedValue(deactivatedProduct);

      const response = await request(testApp)
        .post(`/products/${validId}/deactivate`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isActive).toBe(false);
      expect(mockProductService.updateProduct).toHaveBeenCalledWith(
        validId,
        { isActive: false },
        'admin-123'
      );
    });

    it('should return 200 on successful deactivation by MANAGER', async () => {
      setupRoleAuth(UserRole.MANAGER);
      const deactivatedProduct = { ...mockProduct, isActive: false };
      (mockProductService.updateProduct as jest.Mock).mockResolvedValue(deactivatedProduct);

      const response = await request(testApp)
        .post(`/products/${validId}/deactivate`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockProductService.updateProduct).toHaveBeenCalledWith(
        validId,
        { isActive: false },
        'user-manager-123'
      );
    });

    it('should return 401 when no token provided', async () => {
      const response = await request(testApp).post(`/products/${validId}/deactivate`);

      expect(response.status).toBe(401);
    });

    it('should return 403 for TARGET user', async () => {
      setupRoleAuth(UserRole.TARGET);

      const response = await request(testApp)
        .post(`/products/${validId}/deactivate`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(403);
    });

    it('should return 403 for MARKETING user', async () => {
      setupRoleAuth(UserRole.MARKETING);

      const response = await request(testApp)
        .post(`/products/${validId}/deactivate`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(403);
    });

    it('should return 404 when product not found', async () => {
      setupAdminAuth();
      (mockProductService.updateProduct as jest.Mock).mockRejectedValue(new ProductNotFoundError());

      const response = await request(testApp)
        .post(`/products/${validId}/deactivate`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PRODUCT_NOT_FOUND');
    });
  });
});
