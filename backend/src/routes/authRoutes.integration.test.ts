import request from 'supertest';
import express, { Router } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../lib/prisma';
import * as tokenService from '../application/services/tokenService';
import { InvalidTokenError } from '../domain/errors/AuthError';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import { UserRole } from '../generated/prisma/enums';

// Mock dependencies
jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $queryRaw: jest.fn(),
  },
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('../application/services/tokenService', () => ({
  generateAccessToken: jest.fn(),
  generateRefreshToken: jest.fn(),
  verifyAccessToken: jest.fn(),
  refreshTokens: jest.fn(),
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockTokenService = tokenService as jest.Mocked<typeof tokenService>;

// Create test app with routes
const createTestApp = () => {
  const testApp = express();
  testApp.use(express.json());

  // Add test routes for RBAC testing
  const testRouter = Router();
  testRouter.get('/admin-only', authMiddleware, requireRole(UserRole.ADMIN), (_req, res) => {
    res.json({ success: true, data: { message: 'Admin access granted' } });
  });
  testRouter.get(
    '/manager-or-admin',
    authMiddleware,
    requireRole([UserRole.ADMIN, UserRole.MANAGER]),
    (_req, res) => {
      res.json({ success: true, data: { message: 'Access granted' } });
    }
  );
  testApp.use('/test', testRouter);

  // Mount the actual auth routes

  const routes = require('./index').default;
  testApp.use(routes);

  return testApp;
};

const testApp = createTestApp();

describe('Auth Routes Integration', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    firstName: 'Test',
    lastName: 'User',
    role: UserRole.TARGET,
    isActive: true,
    emailVerifiedAt: null,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    refreshTokenHash: null,
    passwordResetToken: null,
    passwordResetExpires: null,
    phone: null,
  };

  const validPassword = 'ValidPass123!';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    const registerPayload = {
      email: 'newuser@example.com',
      password: validPassword,
      firstName: 'New',
      lastName: 'User',
    };

    it('should return 201 with user data on successful registration', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (mockBcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      (mockPrisma.user.create as jest.Mock).mockResolvedValue({
        ...mockUser,
        email: registerPayload.email,
        firstName: registerPayload.firstName,
        lastName: registerPayload.lastName,
      });

      const response = await request(testApp).post('/auth/register').send(registerPayload);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(registerPayload.email);
      expect(response.body.data).not.toHaveProperty('passwordHash');
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(testApp)
        .post('/auth/register')
        .send({ ...registerPayload, email: 'invalid-email' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.field).toBe('email');
    });

    it('should return 400 for weak password', async () => {
      const response = await request(testApp)
        .post('/auth/register')
        .send({ ...registerPayload, password: 'weak' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.field).toBe('password');
    });

    it('should return 409 when email already exists', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(testApp).post('/auth/register').send(registerPayload);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
    });
  });

  describe('POST /auth/login', () => {
    const loginPayload = {
      email: 'test@example.com',
      password: validPassword,
    };

    it('should return 200 with tokens on successful login', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);
      (mockPrisma.user.update as jest.Mock).mockResolvedValue(mockUser);
      (mockTokenService.generateAccessToken as jest.Mock).mockReturnValue('access-token');
      (mockTokenService.generateRefreshToken as jest.Mock).mockResolvedValue('refresh-token');

      const response = await request(testApp).post('/auth/login').send(loginPayload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(loginPayload.email);
      expect(response.body.data.accessToken).toBe('access-token');
      expect(response.body.data.refreshToken).toBe('refresh-token');
    });

    it('should return 401 for invalid credentials (wrong password)', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(false);

      const response = await request(testApp).post('/auth/login').send(loginPayload);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return 401 for non-existent user', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(testApp).post('/auth/login').send(loginPayload);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return 401 for inactive user', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      const response = await request(testApp).post('/auth/login').send(loginPayload);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_NOT_ACTIVE');
    });

    it('should return 400 for missing email', async () => {
      const response = await request(testApp).post('/auth/login').send({ password: validPassword });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.field).toBe('email');
    });
  });

  describe('POST /auth/logout', () => {
    it('should return 200 on successful logout', async () => {
      (mockTokenService.verifyAccessToken as jest.Mock).mockReturnValue({
        userId: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockPrisma.user.update as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(testApp)
        .post('/auth/logout')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('Logged out successfully');
    });

    it('should return 401 when no token provided', async () => {
      const response = await request(testApp).post('/auth/logout');

      expect(response.status).toBe(401);
    });

    it('should return 401 for invalid token', async () => {
      (mockTokenService.verifyAccessToken as jest.Mock).mockImplementation(() => {
        throw new InvalidTokenError();
      });

      const response = await request(testApp)
        .post('/auth/logout')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /auth/refresh', () => {
    const refreshPayload = {
      refreshToken: 'a'.repeat(64),
      userId: '123e4567-e89b-12d3-a456-426614174000', // Valid UUID format
    };

    it('should return 200 with new tokens on successful refresh', async () => {
      (mockTokenService.refreshTokens as jest.Mock).mockResolvedValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });

      const response = await request(testApp).post('/auth/refresh').send(refreshPayload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBe('new-access-token');
      expect(response.body.data.refreshToken).toBe('new-refresh-token');
    });

    it('should return 401 for invalid refresh token', async () => {
      (mockTokenService.refreshTokens as jest.Mock).mockRejectedValue(new InvalidTokenError());

      const response = await request(testApp).post('/auth/refresh').send(refreshPayload);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });

    it('should return 400 for invalid userId format', async () => {
      const response = await request(testApp)
        .post('/auth/refresh')
        .send({ ...refreshPayload, userId: 'not-a-uuid' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.field).toBe('userId');
    });

    it('should return 400 for missing refresh token', async () => {
      const response = await request(testApp).post('/auth/refresh').send({ userId: mockUser.id });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.field).toBe('refreshToken');
    });
  });

  describe('POST /auth/forgot-password', () => {
    it('should return 200 for existing user', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockBcrypt.hash as jest.Mock).mockResolvedValue('hashed-token');
      (mockPrisma.user.update as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(testApp)
        .post('/auth/forgot-password')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('password reset');
    });

    it('should return 200 for non-existent user (security)', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(testApp)
        .post('/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      // Same message for security
      expect(response.body.data.message).toContain('password reset');
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(testApp)
        .post('/auth/forgot-password')
        .send({ email: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.field).toBe('email');
    });
  });

  describe('POST /auth/reset-password', () => {
    const resetPayload = {
      token: 'a'.repeat(64),
      newPassword: 'NewValidPass123!',
    };

    it('should return 200 on successful password reset', async () => {
      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue({
        ...mockUser,
        passwordResetToken: 'hashed-token',
        passwordResetExpires: new Date(Date.now() + 3600000), // 1 hour from now
      });
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);
      (mockBcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');
      (mockPrisma.user.update as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(testApp).post('/auth/reset-password').send(resetPayload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('reset successfully');
    });

    it('should return 400 for invalid token', async () => {
      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(null);

      const response = await request(testApp).post('/auth/reset-password').send(resetPayload);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PASSWORD_RESET_TOKEN_INVALID');
    });

    it('should return 400 for expired token', async () => {
      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue({
        ...mockUser,
        passwordResetToken: 'hashed-token',
        passwordResetExpires: new Date(Date.now() - 3600000), // 1 hour ago
      });
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);

      const response = await request(testApp).post('/auth/reset-password').send(resetPayload);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PASSWORD_RESET_TOKEN_EXPIRED');
    });

    it('should return 400 for weak new password', async () => {
      const response = await request(testApp)
        .post('/auth/reset-password')
        .send({ ...resetPayload, newPassword: 'weak' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.field).toBe('newPassword');
    });
  });

  describe('Role-Based Access Control', () => {
    describe('GET /test/admin-only', () => {
      it('should return 200 when user has ADMIN role', async () => {
        (mockTokenService.verifyAccessToken as jest.Mock).mockReturnValue({
          userId: 'admin-123',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        });

        const response = await request(testApp)
          .get('/test/admin-only')
          .set('Authorization', 'Bearer valid-admin-token');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.message).toBe('Admin access granted');
      });

      it('should return 403 when user has TARGET role', async () => {
        (mockTokenService.verifyAccessToken as jest.Mock).mockReturnValue({
          userId: 'user-123',
          email: 'user@example.com',
          role: UserRole.TARGET,
        });

        const response = await request(testApp)
          .get('/test/admin-only')
          .set('Authorization', 'Bearer valid-user-token');

        expect(response.status).toBe(403);
      });

      it('should return 403 when user has MANAGER role', async () => {
        (mockTokenService.verifyAccessToken as jest.Mock).mockReturnValue({
          userId: 'manager-123',
          email: 'manager@example.com',
          role: UserRole.MANAGER,
        });

        const response = await request(testApp)
          .get('/test/admin-only')
          .set('Authorization', 'Bearer valid-manager-token');

        expect(response.status).toBe(403);
      });

      it('should return 401 when no token provided', async () => {
        const response = await request(testApp).get('/test/admin-only');

        expect(response.status).toBe(401);
      });
    });

    describe('GET /test/manager-or-admin', () => {
      it('should return 200 when user has ADMIN role', async () => {
        (mockTokenService.verifyAccessToken as jest.Mock).mockReturnValue({
          userId: 'admin-123',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        });

        const response = await request(testApp)
          .get('/test/manager-or-admin')
          .set('Authorization', 'Bearer valid-admin-token');

        expect(response.status).toBe(200);
      });

      it('should return 200 when user has MANAGER role', async () => {
        (mockTokenService.verifyAccessToken as jest.Mock).mockReturnValue({
          userId: 'manager-123',
          email: 'manager@example.com',
          role: UserRole.MANAGER,
        });

        const response = await request(testApp)
          .get('/test/manager-or-admin')
          .set('Authorization', 'Bearer valid-manager-token');

        expect(response.status).toBe(200);
      });

      it('should return 403 when user has TARGET role', async () => {
        (mockTokenService.verifyAccessToken as jest.Mock).mockReturnValue({
          userId: 'user-123',
          email: 'user@example.com',
          role: UserRole.TARGET,
        });

        const response = await request(testApp)
          .get('/test/manager-or-admin')
          .set('Authorization', 'Bearer valid-user-token');

        expect(response.status).toBe(403);
      });

      it('should return 403 when user has MARKETING role', async () => {
        (mockTokenService.verifyAccessToken as jest.Mock).mockReturnValue({
          userId: 'marketing-123',
          email: 'marketing@example.com',
          role: UserRole.MARKETING,
        });

        const response = await request(testApp)
          .get('/test/manager-or-admin')
          .set('Authorization', 'Bearer valid-marketing-token');

        expect(response.status).toBe(403);
      });
    });
  });
});
