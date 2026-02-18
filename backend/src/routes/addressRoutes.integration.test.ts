import request from 'supertest';
import express from 'express';
import prisma from '../lib/prisma';
import * as tokenService from '../application/services/tokenService';
import { UserRole } from '../generated/prisma/enums';
import type { Address } from '../generated/prisma/client';

jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    address: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
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

const createTestApp = () => {
  const testApp = express();
  testApp.use(express.json());
  const routes = require('./index').default;
  testApp.use(routes);
  return testApp;
};

const testApp = createTestApp();

const USER_ID = '123e4567-e89b-12d3-a456-426614174000';
const ADDRESS_ID = '223e4567-e89b-12d3-a456-426614174001';

const setupAuth = () => {
  (mockTokenService.verifyAccessToken as jest.Mock).mockReturnValue({
    userId: USER_ID,
    email: 'user@example.com',
    role: UserRole.TARGET,
  });
};

const mockAddress: Address = {
  id: ADDRESS_ID,
  userId: USER_ID,
  label: null,
  firstName: 'John',
  lastName: 'Doe',
  streetLine1: '123 Main St',
  streetLine2: null,
  city: 'Springfield',
  state: null,
  postalCode: '12345',
  countryCode: 'US',
  phone: null,
  isDefault: false,
  createdAt: new Date('2026-02-18'),
  updatedAt: new Date('2026-02-18'),
};

const validCreatePayload = {
  firstName: 'John',
  lastName: 'Doe',
  streetLine1: '123 Main St',
  city: 'Springfield',
  postalCode: '12345',
  countryCode: 'US',
};

describe('Address Routes Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /users/me/addresses', () => {
    it('should return 401 without authentication token', async () => {
      const response = await request(testApp).get('/users/me/addresses');

      expect(response.status).toBe(401);
    });

    it('should return 200 with list of addresses for authenticated user', async () => {
      setupAuth();
      (mockPrisma.address.findMany as jest.Mock).mockResolvedValue([mockAddress, mockAddress]);

      const response = await request(testApp)
        .get('/users/me/addresses')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it('should return 200 with empty array when user has no addresses', async () => {
      setupAuth();
      (mockPrisma.address.findMany as jest.Mock).mockResolvedValue([]);

      const response = await request(testApp)
        .get('/users/me/addresses')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
    });
  });

  describe('POST /users/me/addresses', () => {
    it('should return 401 without authentication token', async () => {
      const response = await request(testApp).post('/users/me/addresses').send(validCreatePayload);

      expect(response.status).toBe(401);
    });

    it('should return 201 with created address for valid input', async () => {
      setupAuth();
      const firstAddress = { ...mockAddress, isDefault: true };
      (mockPrisma.address.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.address.create as jest.Mock).mockResolvedValue(firstAddress);

      const response = await request(testApp)
        .post('/users/me/addresses')
        .set('Authorization', 'Bearer valid-token')
        .send(validCreatePayload);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.firstName).toBe('John');
    });

    it('should return 400 for missing required fields (no firstName)', async () => {
      setupAuth();

      const response = await request(testApp)
        .post('/users/me/addresses')
        .set('Authorization', 'Bearer valid-token')
        .send({
          lastName: 'Doe',
          streetLine1: 'x',
          city: 'y',
          postalCode: 'z',
          countryCode: 'US',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_ADDRESS_DATA');
    });

    it('should return 409 when user has 10 addresses', async () => {
      setupAuth();
      (mockPrisma.address.count as jest.Mock).mockResolvedValue(10);

      const response = await request(testApp)
        .post('/users/me/addresses')
        .set('Authorization', 'Bearer valid-token')
        .send(validCreatePayload);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ADDRESS_LIMIT_EXCEEDED');
    });
  });

  describe('GET /users/me/addresses/:addressId', () => {
    it('should return 401 without authentication token', async () => {
      const response = await request(testApp).get(`/users/me/addresses/${ADDRESS_ID}`);

      expect(response.status).toBe(401);
    });

    it('should return 200 with address when found', async () => {
      setupAuth();
      (mockPrisma.address.findFirst as jest.Mock).mockResolvedValue(mockAddress);

      const response = await request(testApp)
        .get(`/users/me/addresses/${ADDRESS_ID}`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(ADDRESS_ID);
    });

    it('should return 404 when address not found', async () => {
      setupAuth();
      (mockPrisma.address.findFirst as jest.Mock).mockResolvedValue(null);

      const response = await request(testApp)
        .get(`/users/me/addresses/${ADDRESS_ID}`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('ADDRESS_NOT_FOUND');
    });

    it('should return 400 for invalid addressId format', async () => {
      setupAuth();

      const response = await request(testApp)
        .get('/users/me/addresses/not-a-uuid')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_ADDRESS_DATA');
    });
  });

  describe('PATCH /users/me/addresses/:addressId', () => {
    it('should return 401 without authentication token', async () => {
      const response = await request(testApp)
        .patch(`/users/me/addresses/${ADDRESS_ID}`)
        .send({ firstName: 'Jane' });

      expect(response.status).toBe(401);
    });

    it('should return 200 with updated address', async () => {
      setupAuth();
      const updatedAddress = { ...mockAddress, firstName: 'Jane' };
      (mockPrisma.address.findFirst as jest.Mock).mockResolvedValue(mockAddress);
      (mockPrisma.address.update as jest.Mock).mockResolvedValue(updatedAddress);

      const response = await request(testApp)
        .patch(`/users/me/addresses/${ADDRESS_ID}`)
        .set('Authorization', 'Bearer valid-token')
        .send({ firstName: 'Jane' });

      expect(response.status).toBe(200);
      expect(response.body.data.firstName).toBe('Jane');
    });

    it('should return 404 when address not found', async () => {
      setupAuth();
      (mockPrisma.address.findFirst as jest.Mock).mockResolvedValue(null);

      const response = await request(testApp)
        .patch(`/users/me/addresses/${ADDRESS_ID}`)
        .set('Authorization', 'Bearer valid-token')
        .send({ firstName: 'Jane' });

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('ADDRESS_NOT_FOUND');
    });

    it('should return 400 for invalid input', async () => {
      setupAuth();

      const response = await request(testApp)
        .patch(`/users/me/addresses/${ADDRESS_ID}`)
        .set('Authorization', 'Bearer valid-token')
        .send({ countryCode: 'USA' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_ADDRESS_DATA');
    });
  });

  describe('DELETE /users/me/addresses/:addressId', () => {
    it('should return 401 without authentication token', async () => {
      const response = await request(testApp).delete(`/users/me/addresses/${ADDRESS_ID}`);

      expect(response.status).toBe(401);
    });

    it('should return 204 when address deleted', async () => {
      setupAuth();
      const nonDefaultAddress = { ...mockAddress, isDefault: false };
      (mockPrisma.address.findFirst as jest.Mock).mockResolvedValue(nonDefaultAddress);
      (mockPrisma.address.delete as jest.Mock).mockResolvedValue(nonDefaultAddress);

      const response = await request(testApp)
        .delete(`/users/me/addresses/${ADDRESS_ID}`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(204);
    });

    it('should return 404 when address not found', async () => {
      setupAuth();
      (mockPrisma.address.findFirst as jest.Mock).mockResolvedValue(null);

      const response = await request(testApp)
        .delete(`/users/me/addresses/${ADDRESS_ID}`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('ADDRESS_NOT_FOUND');
    });

    it('should return 409 when trying to delete default address with multiple addresses', async () => {
      setupAuth();
      const defaultAddress = { ...mockAddress, isDefault: true };
      (mockPrisma.address.findFirst as jest.Mock).mockResolvedValue(defaultAddress);
      (mockPrisma.address.count as jest.Mock).mockResolvedValue(2);

      const response = await request(testApp)
        .delete(`/users/me/addresses/${ADDRESS_ID}`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('DEFAULT_ADDRESS_CANNOT_BE_DELETED');
    });
  });
});
