/* eslint-disable @typescript-eslint/unbound-method */
import request from 'supertest';
import express from 'express';
import prisma from '../lib/prisma';
import * as tokenService from '../application/services/tokenService';
import { UserRole } from '../generated/prisma/enums';
import { Prisma } from '../generated/prisma/client';
import type { ProductType } from '../generated/prisma/client';

// Mock dependencies
jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    productType: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    $queryRaw: jest.fn(),
  },
}));

jest.mock('../application/services/tokenService', () => ({
  generateAccessToken: jest.fn(),
  generateRefreshToken: jest.fn(),
  verifyAccessToken: jest.fn(),
  refreshTokens: jest.fn(),
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
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

describe('Product Type Routes Integration', () => {
  const mockProductType: ProductType = {
    id: 'pt-uuid-123',
    name: { es: 'Camiseta', en: 'T-Shirt' },
    slug: 't-shirt',
    hasSizes: true,
    isActive: true,
    sortOrder: 1,
    createdAt: new Date('2026-02-10'),
    updatedAt: new Date('2026-02-10'),
  };

  const mockProductTypeInactive: ProductType = {
    id: 'pt-uuid-456',
    name: { es: 'Taza', en: 'Mug' },
    slug: 'mug',
    hasSizes: false,
    isActive: false,
    sortOrder: 2,
    createdAt: new Date('2026-02-10'),
    updatedAt: new Date('2026-02-10'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /product-types', () => {
    it('should return 200 with product types for unauthenticated users', async () => {
      (mockPrisma.productType.findMany as jest.Mock).mockResolvedValue([mockProductType]);

      const response = await request(testApp).get('/product-types');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].slug).toBe('t-shirt');
    });

    it('should filter only active product types for unauthenticated users', async () => {
      (mockPrisma.productType.findMany as jest.Mock).mockResolvedValue([mockProductType]);

      await request(testApp).get('/product-types');

      expect(mockPrisma.productType.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      });
    });

    it('should filter only active product types for TARGET users', async () => {
      setupRoleAuth(UserRole.TARGET);
      (mockPrisma.productType.findMany as jest.Mock).mockResolvedValue([mockProductType]);

      await request(testApp).get('/product-types').set('Authorization', 'Bearer valid-token');

      expect(mockPrisma.productType.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      });
    });

    it('should return all product types for ADMIN users by default', async () => {
      setupAdminAuth();
      (mockPrisma.productType.findMany as jest.Mock).mockResolvedValue([
        mockProductType,
        mockProductTypeInactive,
      ]);

      const response = await request(testApp)
        .get('/product-types')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(mockPrisma.productType.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { sortOrder: 'asc' },
      });
    });

    it('should respect isActive filter for ADMIN users', async () => {
      setupAdminAuth();
      (mockPrisma.productType.findMany as jest.Mock).mockResolvedValue([mockProductTypeInactive]);

      const response = await request(testApp)
        .get('/product-types?isActive=false')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(mockPrisma.productType.findMany).toHaveBeenCalledWith({
        where: { isActive: false },
        orderBy: { sortOrder: 'asc' },
      });
    });

    it('should return all product types for MANAGER users by default', async () => {
      setupRoleAuth(UserRole.MANAGER);
      (mockPrisma.productType.findMany as jest.Mock).mockResolvedValue([
        mockProductType,
        mockProductTypeInactive,
      ]);

      await request(testApp).get('/product-types').set('Authorization', 'Bearer valid-token');

      expect(mockPrisma.productType.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { sortOrder: 'asc' },
      });
    });

    it('should return all product types for MARKETING users by default', async () => {
      setupRoleAuth(UserRole.MARKETING);
      (mockPrisma.productType.findMany as jest.Mock).mockResolvedValue([mockProductType]);

      await request(testApp).get('/product-types').set('Authorization', 'Bearer valid-token');

      expect(mockPrisma.productType.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { sortOrder: 'asc' },
      });
    });

    it('should ignore isActive filter for TARGET users', async () => {
      setupRoleAuth(UserRole.TARGET);
      (mockPrisma.productType.findMany as jest.Mock).mockResolvedValue([mockProductType]);

      await request(testApp)
        .get('/product-types?isActive=false')
        .set('Authorization', 'Bearer valid-token');

      // TARGET users always get isActive: true regardless of query param
      expect(mockPrisma.productType.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      });
    });

    it('should silently ignore invalid auth tokens and treat as unauthenticated', async () => {
      (mockTokenService.verifyAccessToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });
      (mockPrisma.productType.findMany as jest.Mock).mockResolvedValue([mockProductType]);

      const response = await request(testApp)
        .get('/product-types')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(200);
      expect(mockPrisma.productType.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      });
    });
  });

  describe('POST /product-types', () => {
    const createPayload = {
      name: { es: 'Sudadera', en: 'Hoodie' },
      slug: 'hoodie',
      hasSizes: true,
      isActive: true,
      sortOrder: 3,
    };

    it('should return 201 on successful creation by ADMIN', async () => {
      setupAdminAuth();
      const createdProductType = { ...mockProductType, ...createPayload, id: 'pt-new-123' };
      (mockPrisma.productType.create as jest.Mock).mockResolvedValue(createdProductType);

      const response = await request(testApp)
        .post('/product-types')
        .set('Authorization', 'Bearer valid-token')
        .send(createPayload);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.slug).toBe('hoodie');
    });

    it('should return 400 for missing name', async () => {
      setupAdminAuth();

      const response = await request(testApp)
        .post('/product-types')
        .set('Authorization', 'Bearer valid-token')
        .send({ slug: 'hoodie', hasSizes: true });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_PRODUCT_TYPE_DATA');
    });

    it('should return 400 for missing slug', async () => {
      setupAdminAuth();

      const response = await request(testApp)
        .post('/product-types')
        .set('Authorization', 'Bearer valid-token')
        .send({ name: { es: 'Sudadera' }, hasSizes: true });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_PRODUCT_TYPE_DATA');
      expect(response.body.error.field).toBe('slug');
    });

    it('should return 400 for invalid slug format', async () => {
      setupAdminAuth();

      const response = await request(testApp)
        .post('/product-types')
        .set('Authorization', 'Bearer valid-token')
        .send({ ...createPayload, slug: 'INVALID SLUG!' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.field).toBe('slug');
    });

    it('should return 400 for name missing Spanish translation', async () => {
      setupAdminAuth();

      const response = await request(testApp)
        .post('/product-types')
        .set('Authorization', 'Bearer valid-token')
        .send({ ...createPayload, name: { en: 'Hoodie' } });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_PRODUCT_TYPE_DATA');
    });

    it('should return 409 for duplicate slug', async () => {
      setupAdminAuth();
      const prismaError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '6.0.0',
      });
      (mockPrisma.productType.create as jest.Mock).mockRejectedValue(prismaError);

      const response = await request(testApp)
        .post('/product-types')
        .set('Authorization', 'Bearer valid-token')
        .send(createPayload);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PRODUCT_TYPE_SLUG_ALREADY_EXISTS');
    });

    it('should return 401 when no token provided', async () => {
      const response = await request(testApp).post('/product-types').send(createPayload);

      expect(response.status).toBe(401);
    });

    it('should return 403 for TARGET user', async () => {
      setupRoleAuth(UserRole.TARGET);

      const response = await request(testApp)
        .post('/product-types')
        .set('Authorization', 'Bearer valid-token')
        .send(createPayload);

      expect(response.status).toBe(403);
    });

    it('should return 403 for MANAGER user', async () => {
      setupRoleAuth(UserRole.MANAGER);

      const response = await request(testApp)
        .post('/product-types')
        .set('Authorization', 'Bearer valid-token')
        .send(createPayload);

      expect(response.status).toBe(403);
    });

    it('should return 403 for MARKETING user', async () => {
      setupRoleAuth(UserRole.MARKETING);

      const response = await request(testApp)
        .post('/product-types')
        .set('Authorization', 'Bearer valid-token')
        .send(createPayload);

      expect(response.status).toBe(403);
    });
  });

  describe('PATCH /product-types/:id', () => {
    const validId = '123e4567-e89b-12d3-a456-426614174000';
    const updatePayload = { name: { es: 'Camiseta Actualizada', en: 'Updated T-Shirt' } };

    it('should return 200 on successful update by ADMIN', async () => {
      setupAdminAuth();
      (mockPrisma.productType.findUnique as jest.Mock).mockResolvedValue(mockProductType);
      const updatedProductType = { ...mockProductType, ...updatePayload };
      (mockPrisma.productType.update as jest.Mock).mockResolvedValue(updatedProductType);

      const response = await request(testApp)
        .patch(`/product-types/${validId}`)
        .set('Authorization', 'Bearer valid-token')
        .send(updatePayload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name.es).toBe('Camiseta Actualizada');
    });

    it('should return 400 for invalid UUID in id param', async () => {
      setupAdminAuth();

      const response = await request(testApp)
        .patch('/product-types/not-a-uuid')
        .set('Authorization', 'Bearer valid-token')
        .send(updatePayload);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_PRODUCT_TYPE_DATA');
    });

    it('should return 404 when product type not found', async () => {
      setupAdminAuth();
      (mockPrisma.productType.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(testApp)
        .patch(`/product-types/${validId}`)
        .set('Authorization', 'Bearer valid-token')
        .send(updatePayload);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PRODUCT_TYPE_NOT_FOUND');
    });

    it('should return 409 for duplicate slug on update', async () => {
      setupAdminAuth();
      (mockPrisma.productType.findUnique as jest.Mock).mockResolvedValue(mockProductType);
      const prismaError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '6.0.0',
      });
      (mockPrisma.productType.update as jest.Mock).mockRejectedValue(prismaError);

      const response = await request(testApp)
        .patch(`/product-types/${validId}`)
        .set('Authorization', 'Bearer valid-token')
        .send({ slug: 'existing-slug' });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PRODUCT_TYPE_SLUG_ALREADY_EXISTS');
    });

    it('should return 400 for invalid slug format on update', async () => {
      setupAdminAuth();

      const response = await request(testApp)
        .patch(`/product-types/${validId}`)
        .set('Authorization', 'Bearer valid-token')
        .send({ slug: 'BAD SLUG!' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.field).toBe('slug');
    });

    it('should return 401 when no token provided', async () => {
      const response = await request(testApp)
        .patch(`/product-types/${validId}`)
        .send(updatePayload);

      expect(response.status).toBe(401);
    });

    it('should return 403 for non-ADMIN roles', async () => {
      setupRoleAuth(UserRole.TARGET);

      const response = await request(testApp)
        .patch(`/product-types/${validId}`)
        .set('Authorization', 'Bearer valid-token')
        .send(updatePayload);

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /product-types/:id', () => {
    const validId = '123e4567-e89b-12d3-a456-426614174000';

    it('should return 204 on successful deletion by ADMIN', async () => {
      setupAdminAuth();
      (mockPrisma.productType.findUnique as jest.Mock).mockResolvedValue(mockProductType);
      (mockPrisma.productType.delete as jest.Mock).mockResolvedValue(mockProductType);

      const response = await request(testApp)
        .delete(`/product-types/${validId}`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(204);
    });

    it('should return 400 for invalid UUID in id param', async () => {
      setupAdminAuth();

      const response = await request(testApp)
        .delete('/product-types/not-a-uuid')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_PRODUCT_TYPE_DATA');
    });

    it('should return 404 when product type not found', async () => {
      setupAdminAuth();
      (mockPrisma.productType.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(testApp)
        .delete(`/product-types/${validId}`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PRODUCT_TYPE_NOT_FOUND');
    });

    it('should return 401 when no token provided', async () => {
      const response = await request(testApp).delete(`/product-types/${validId}`);

      expect(response.status).toBe(401);
    });

    it('should return 403 for TARGET user', async () => {
      setupRoleAuth(UserRole.TARGET);

      const response = await request(testApp)
        .delete(`/product-types/${validId}`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(403);
    });

    it('should return 403 for MANAGER user', async () => {
      setupRoleAuth(UserRole.MANAGER);

      const response = await request(testApp)
        .delete(`/product-types/${validId}`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(403);
    });

    it('should return 403 for MARKETING user', async () => {
      setupRoleAuth(UserRole.MARKETING);

      const response = await request(testApp)
        .delete(`/product-types/${validId}`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(403);
    });
  });
});
