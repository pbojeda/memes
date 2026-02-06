import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  refreshTokens,
  TokenPayload,
} from './tokenService';
import prisma from '../../lib/prisma';
import { env } from '../../config/env';
import {
  TokenExpiredError,
  InvalidTokenError,
  UserNotFoundError,
  JwtSecretNotConfiguredError,
} from '../../domain/errors/AuthError';
import { UserRole } from '../../generated/prisma/enums';

jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('../../config/env', () => ({
  env: {
    JWT_SECRET: 'test-secret-key-at-least-32-characters-long',
    JWT_ACCESS_EXPIRATION: '15m',
    NODE_ENV: 'test',
    BCRYPT_SALT_ROUNDS: 12,
    REFRESH_TOKEN_BYTES: 32,
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('tokenService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateAccessToken', () => {
    const mockUser = {
      id: 'user-uuid-123',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'TARGET' as UserRole,
      isActive: true,
      emailVerifiedAt: null,
      lastLoginAt: new Date(),
      createdAt: new Date(),
    };

    it('should return a valid JWT string', () => {
      (mockJwt.sign as jest.Mock).mockReturnValue('mock.jwt.token');

      const result = generateAccessToken(mockUser);

      expect(result).toBe('mock.jwt.token');
      expect(mockJwt.sign).toHaveBeenCalled();
    });

    it('should include user id, email, role in payload', () => {
      (mockJwt.sign as jest.Mock).mockReturnValue('mock.jwt.token');

      generateAccessToken(mockUser);

      expect(mockJwt.sign).toHaveBeenCalledWith(
        {
          userId: 'user-uuid-123',
          email: 'test@example.com',
          role: 'TARGET',
        },
        'test-secret-key-at-least-32-characters-long',
        { expiresIn: '15m' }
      );
    });

    it('should use configured expiration time', () => {
      (mockJwt.sign as jest.Mock).mockReturnValue('mock.jwt.token');

      generateAccessToken(mockUser);

      expect(mockJwt.sign).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(String),
        { expiresIn: '15m' }
      );
    });

    it('should throw JwtSecretNotConfiguredError if JWT_SECRET not configured', () => {
      const originalSecret = env.JWT_SECRET;
      (env as { JWT_SECRET: string | undefined }).JWT_SECRET = undefined;

      expect(() => generateAccessToken(mockUser)).toThrow(JwtSecretNotConfiguredError);

      (env as { JWT_SECRET: string | undefined }).JWT_SECRET = originalSecret;
    });
  });

  describe('generateRefreshToken', () => {
    const userId = 'user-uuid-123';

    const mockUser = {
      id: userId,
      email: 'test@example.com',
      passwordHash: 'hashed_password',
      firstName: 'John',
      lastName: 'Doe',
      role: 'TARGET' as UserRole,
      isActive: true,
      stripeCustomerId: null,
      emailVerifiedAt: null,
      passwordResetToken: null,
      passwordResetExpires: null,
      lastLoginAt: new Date(),
      refreshTokenHash: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      phone: null,
    };

    it('should return a refresh token string', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockBcrypt.hash as jest.Mock).mockResolvedValue('hashed_refresh_token');
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        refreshTokenHash: 'hashed_refresh_token',
      });

      const result = await generateRefreshToken(userId);

      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should store hashed token in database', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockBcrypt.hash as jest.Mock).mockResolvedValue('hashed_refresh_token');
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        refreshTokenHash: 'hashed_refresh_token',
      });

      await generateRefreshToken(userId);

      expect(mockBcrypt.hash).toHaveBeenCalled();
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { refreshTokenHash: 'hashed_refresh_token' },
      });
    });

    it('should throw UserNotFoundError if user does not exist', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(generateRefreshToken(userId)).rejects.toThrow(UserNotFoundError);
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe('verifyAccessToken', () => {
    const validPayload: TokenPayload = {
      userId: 'user-uuid-123',
      email: 'test@example.com',
      role: 'TARGET' as UserRole,
    };

    it('should return decoded payload for valid token', () => {
      (mockJwt.verify as jest.Mock).mockReturnValue(validPayload);

      const result = verifyAccessToken('valid.jwt.token');

      expect(result).toEqual(validPayload);
      expect(mockJwt.verify).toHaveBeenCalledWith(
        'valid.jwt.token',
        'test-secret-key-at-least-32-characters-long'
      );
    });

    it('should throw TokenExpiredError for expired token', () => {
      const expiredError = new Error('jwt expired');
      expiredError.name = 'TokenExpiredError';
      (mockJwt.verify as jest.Mock).mockImplementation(() => {
        throw expiredError;
      });

      expect(() => verifyAccessToken('expired.jwt.token')).toThrow(TokenExpiredError);
    });

    it('should throw InvalidTokenError for malformed token', () => {
      const malformedError = new Error('jwt malformed');
      malformedError.name = 'JsonWebTokenError';
      (mockJwt.verify as jest.Mock).mockImplementation(() => {
        throw malformedError;
      });

      expect(() => verifyAccessToken('malformed.token')).toThrow(InvalidTokenError);
    });

    it('should throw InvalidTokenError for wrong signature', () => {
      const signatureError = new Error('invalid signature');
      signatureError.name = 'JsonWebTokenError';
      (mockJwt.verify as jest.Mock).mockImplementation(() => {
        throw signatureError;
      });

      expect(() => verifyAccessToken('wrong.signature.token')).toThrow(InvalidTokenError);
    });

    it('should throw JwtSecretNotConfiguredError if JWT_SECRET not configured', () => {
      const originalSecret = env.JWT_SECRET;
      (env as { JWT_SECRET: string | undefined }).JWT_SECRET = undefined;

      expect(() => verifyAccessToken('any.token')).toThrow(JwtSecretNotConfiguredError);

      (env as { JWT_SECRET: string | undefined }).JWT_SECRET = originalSecret;
    });
  });

  describe('refreshTokens', () => {
    const userId = 'user-uuid-123';
    const validRefreshToken = 'valid-refresh-token';

    const mockUser = {
      id: userId,
      email: 'test@example.com',
      passwordHash: 'hashed_password',
      firstName: 'John',
      lastName: 'Doe',
      role: 'TARGET' as UserRole,
      isActive: true,
      stripeCustomerId: null,
      emailVerifiedAt: null,
      passwordResetToken: null,
      passwordResetExpires: null,
      lastLoginAt: new Date(),
      refreshTokenHash: 'stored_hash',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      phone: null,
    };

    it('should return new access and refresh tokens', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);
      (mockJwt.sign as jest.Mock).mockReturnValue('new.access.token');
      (mockBcrypt.hash as jest.Mock).mockResolvedValue('new_hashed_refresh');
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        refreshTokenHash: 'new_hashed_refresh',
      });

      const result = await refreshTokens(validRefreshToken, userId);

      expect(result.accessToken).toBe('new.access.token');
      expect(typeof result.refreshToken).toBe('string');
    });

    it('should invalidate old refresh token by updating hash in DB', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);
      (mockJwt.sign as jest.Mock).mockReturnValue('new.access.token');
      (mockBcrypt.hash as jest.Mock).mockResolvedValue('new_hashed_refresh');
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        refreshTokenHash: 'new_hashed_refresh',
      });

      await refreshTokens(validRefreshToken, userId);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { refreshTokenHash: 'new_hashed_refresh' },
      });
    });

    it('should throw InvalidTokenError for invalid refresh token', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(refreshTokens('invalid-token', userId)).rejects.toThrow(InvalidTokenError);
    });

    it('should throw InvalidTokenError if user has no stored refresh token', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        refreshTokenHash: null,
      });

      await expect(refreshTokens(validRefreshToken, userId)).rejects.toThrow(InvalidTokenError);
    });

    it('should throw UserNotFoundError if user does not exist', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(refreshTokens(validRefreshToken, userId)).rejects.toThrow(UserNotFoundError);
    });
  });
});
