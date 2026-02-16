import request from 'supertest';
import express from 'express';
import * as productImageService from '../application/services/productImageService';
import * as tokenService from '../application/services/tokenService';
import { UserRole } from '../generated/prisma/enums';
import {
  InvalidProductImageDataError,
  ProductImageNotFoundError,
} from '../domain/errors/ProductImageError';
import { ProductNotFoundError } from '../domain/errors/ProductError';

// Mock dependencies
jest.mock('../application/services/productImageService');
jest.mock('../application/services/tokenService', () => ({
  generateAccessToken: jest.fn(),
  generateRefreshToken: jest.fn(),
  verifyAccessToken: jest.fn(),
  refreshTokens: jest.fn(),
}));

const mockProductImageService = productImageService as jest.Mocked<typeof productImageService>;
const mockTokenService = tokenService as jest.Mocked<typeof tokenService>;

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

describe('Product Image Routes Integration', () => {
  const validProductId = '123e4567-e89b-12d3-a456-426614174000';
  const validImageId = 'img-uuid-001';

  const mockProductImage = {
    id: 'img-uuid-001',
    productId: '123e4567-e89b-12d3-a456-426614174000',
    url: 'https://res.cloudinary.com/test/image/upload/v1/products/image1.jpg',
    altText: null,
    sortOrder: 1,
    isPrimary: true,
    createdAt: new Date('2026-02-11'),
  };

  const mockProductImage2 = {
    id: 'img-uuid-002',
    productId: '123e4567-e89b-12d3-a456-426614174000',
    url: 'https://res.cloudinary.com/test/image/upload/v1/products/image2.jpg',
    altText: 'Alternative text',
    sortOrder: 2,
    isPrimary: false,
    createdAt: new Date('2026-02-11'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /products/:productId/images', () => {
    it('should return 200 with images list (public, no auth)', async () => {
      (mockProductImageService.listProductImages as jest.Mock).mockResolvedValue([
        mockProductImage,
        mockProductImage2,
      ]);

      const response = await request(testApp).get(`/products/${validProductId}/images`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].url).toBe(mockProductImage.url);
      expect(mockProductImageService.listProductImages).toHaveBeenCalledWith(validProductId);
    });

    it('should return 200 with empty array when no images', async () => {
      (mockProductImageService.listProductImages as jest.Mock).mockResolvedValue([]);

      const response = await request(testApp).get(`/products/${validProductId}/images`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('should return 404 when product not found', async () => {
      (mockProductImageService.listProductImages as jest.Mock).mockRejectedValue(
        new ProductNotFoundError()
      );

      const response = await request(testApp).get(`/products/${validProductId}/images`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PRODUCT_NOT_FOUND');
    });
  });

  describe('POST /products/:productId/images', () => {
    const createPayload = {
      url: 'https://res.cloudinary.com/test/image/upload/v1/products/new-image.jpg',
      altText: 'New product image',
      sortOrder: 3,
      isPrimary: false,
    };

    it('should return 201 on successful add by ADMIN', async () => {
      setupAdminAuth();
      const createdImage = { ...mockProductImage, ...createPayload, id: 'img-new-123' };
      (mockProductImageService.addProductImage as jest.Mock).mockResolvedValue(createdImage);

      const response = await request(testApp)
        .post(`/products/${validProductId}/images`)
        .set('Authorization', 'Bearer valid-token')
        .send(createPayload);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.url).toBe(createPayload.url);
      expect(mockProductImageService.addProductImage).toHaveBeenCalledWith(
        validProductId,
        createPayload
      );
    });

    it('should return 201 on successful add by MANAGER', async () => {
      setupRoleAuth(UserRole.MANAGER);
      const createdImage = { ...mockProductImage, ...createPayload, id: 'img-new-123' };
      (mockProductImageService.addProductImage as jest.Mock).mockResolvedValue(createdImage);

      const response = await request(testApp)
        .post(`/products/${validProductId}/images`)
        .set('Authorization', 'Bearer valid-token')
        .send(createPayload);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should return 401 when no token provided', async () => {
      const response = await request(testApp)
        .post(`/products/${validProductId}/images`)
        .send(createPayload);

      expect(response.status).toBe(401);
    });

    it('should return 403 for TARGET user', async () => {
      setupRoleAuth(UserRole.TARGET);

      const response = await request(testApp)
        .post(`/products/${validProductId}/images`)
        .set('Authorization', 'Bearer valid-token')
        .send(createPayload);

      expect(response.status).toBe(403);
    });

    it('should return 403 for MARKETING user', async () => {
      setupRoleAuth(UserRole.MARKETING);

      const response = await request(testApp)
        .post(`/products/${validProductId}/images`)
        .set('Authorization', 'Bearer valid-token')
        .send(createPayload);

      expect(response.status).toBe(403);
    });

    it('should return 400 for validation error', async () => {
      setupAdminAuth();
      (mockProductImageService.addProductImage as jest.Mock).mockRejectedValue(
        new InvalidProductImageDataError('Invalid URL format', 'url')
      );

      const response = await request(testApp)
        .post(`/products/${validProductId}/images`)
        .set('Authorization', 'Bearer valid-token')
        .send({ url: 'invalid-url' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_PRODUCT_IMAGE_DATA');
      expect(response.body.error.field).toBe('url');
    });

    it('should return 404 when product not found', async () => {
      setupAdminAuth();
      (mockProductImageService.addProductImage as jest.Mock).mockRejectedValue(
        new ProductNotFoundError()
      );

      const response = await request(testApp)
        .post(`/products/${validProductId}/images`)
        .set('Authorization', 'Bearer valid-token')
        .send(createPayload);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PRODUCT_NOT_FOUND');
    });
  });

  describe('PATCH /products/:productId/images/:imageId', () => {
    const updatePayload = {
      altText: 'Updated alt text',
      sortOrder: 5,
    };

    it('should return 200 on successful update by ADMIN', async () => {
      setupAdminAuth();
      const updatedImage = { ...mockProductImage, ...updatePayload };
      (mockProductImageService.updateProductImage as jest.Mock).mockResolvedValue(updatedImage);

      const response = await request(testApp)
        .patch(`/products/${validProductId}/images/${validImageId}`)
        .set('Authorization', 'Bearer valid-token')
        .send(updatePayload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.altText).toBe('Updated alt text');
      expect(mockProductImageService.updateProductImage).toHaveBeenCalledWith(
        validProductId,
        validImageId,
        updatePayload
      );
    });

    it('should return 200 on successful update by MANAGER', async () => {
      setupRoleAuth(UserRole.MANAGER);
      const updatedImage = { ...mockProductImage, ...updatePayload };
      (mockProductImageService.updateProductImage as jest.Mock).mockResolvedValue(updatedImage);

      const response = await request(testApp)
        .patch(`/products/${validProductId}/images/${validImageId}`)
        .set('Authorization', 'Bearer valid-token')
        .send(updatePayload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 401 when no token provided', async () => {
      const response = await request(testApp)
        .patch(`/products/${validProductId}/images/${validImageId}`)
        .send(updatePayload);

      expect(response.status).toBe(401);
    });

    it('should return 403 for TARGET user', async () => {
      setupRoleAuth(UserRole.TARGET);

      const response = await request(testApp)
        .patch(`/products/${validProductId}/images/${validImageId}`)
        .set('Authorization', 'Bearer valid-token')
        .send(updatePayload);

      expect(response.status).toBe(403);
    });

    it('should return 400 for validation error', async () => {
      setupAdminAuth();
      (mockProductImageService.updateProductImage as jest.Mock).mockRejectedValue(
        new InvalidProductImageDataError('Sort order must be positive', 'sortOrder')
      );

      const response = await request(testApp)
        .patch(`/products/${validProductId}/images/${validImageId}`)
        .set('Authorization', 'Bearer valid-token')
        .send({ sortOrder: -1 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_PRODUCT_IMAGE_DATA');
      expect(response.body.error.field).toBe('sortOrder');
    });

    it('should return 404 when image not found', async () => {
      setupAdminAuth();
      (mockProductImageService.updateProductImage as jest.Mock).mockRejectedValue(
        new ProductImageNotFoundError()
      );

      const response = await request(testApp)
        .patch(`/products/${validProductId}/images/${validImageId}`)
        .set('Authorization', 'Bearer valid-token')
        .send(updatePayload);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PRODUCT_IMAGE_NOT_FOUND');
    });
  });

  describe('DELETE /products/:productId/images/:imageId', () => {
    it('should return 204 on successful delete by ADMIN', async () => {
      setupAdminAuth();
      (mockProductImageService.deleteProductImage as jest.Mock).mockResolvedValue(undefined);

      const response = await request(testApp)
        .delete(`/products/${validProductId}/images/${validImageId}`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(204);
      expect(mockProductImageService.deleteProductImage).toHaveBeenCalledWith(
        validProductId,
        validImageId
      );
    });

    it('should return 204 on successful delete by MANAGER', async () => {
      setupRoleAuth(UserRole.MANAGER);
      (mockProductImageService.deleteProductImage as jest.Mock).mockResolvedValue(undefined);

      const response = await request(testApp)
        .delete(`/products/${validProductId}/images/${validImageId}`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(204);
    });

    it('should return 401 when no token provided', async () => {
      const response = await request(testApp).delete(
        `/products/${validProductId}/images/${validImageId}`
      );

      expect(response.status).toBe(401);
    });

    it('should return 403 for TARGET user', async () => {
      setupRoleAuth(UserRole.TARGET);

      const response = await request(testApp)
        .delete(`/products/${validProductId}/images/${validImageId}`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(403);
    });

    it('should return 403 for MARKETING user', async () => {
      setupRoleAuth(UserRole.MARKETING);

      const response = await request(testApp)
        .delete(`/products/${validProductId}/images/${validImageId}`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(403);
    });

    it('should return 404 when image not found', async () => {
      setupAdminAuth();
      (mockProductImageService.deleteProductImage as jest.Mock).mockRejectedValue(
        new ProductImageNotFoundError()
      );

      const response = await request(testApp)
        .delete(`/products/${validProductId}/images/${validImageId}`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PRODUCT_IMAGE_NOT_FOUND');
    });
  });
});
