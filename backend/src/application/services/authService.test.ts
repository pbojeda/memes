import bcrypt from 'bcrypt';
import { register, login, logout, requestPasswordReset, resetPassword } from './authService';
import prisma from '../../lib/prisma';
import {
  InvalidCredentialsError,
  EmailAlreadyExistsError,
  UserNotActiveError,
  UserNotFoundError,
  PasswordResetTokenInvalidError,
  PasswordResetTokenExpiredError,
} from '../../domain/errors/AuthError';
import { UserRole } from '../../generated/prisma/enums';

jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('crypto', () => ({
  randomBytes: jest.fn(() => ({
    toString: jest.fn(() => 'a'.repeat(64)),
  })),
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const validInput = {
      email: 'test@example.com',
      password: 'Password123!',
      firstName: 'John',
      lastName: 'Doe',
    };

    const mockCreatedUser = {
      id: 'uuid-123',
      email: 'test@example.com',
      passwordHash: 'hashed_password',
      firstName: 'John',
      lastName: 'Doe',
      phone: null,
      role: 'TARGET' as UserRole,
      isActive: true,
      stripeCustomerId: null,
      emailVerifiedAt: null,
      passwordResetToken: null,
      passwordResetExpires: null,
      lastLoginAt: null,
      refreshTokenHash: null,
      createdAt: new Date('2026-02-05'),
      updatedAt: new Date('2026-02-05'),
      deletedAt: null,
    };

    it('should create user with hashed password when valid data provided', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (mockBcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      (mockPrisma.user.create as jest.Mock).mockResolvedValue(mockCreatedUser);

      const result = await register(validInput);

      expect(mockBcrypt.hash).toHaveBeenCalledWith('Password123!', 12);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          passwordHash: 'hashed_password',
          firstName: 'John',
          lastName: 'Doe',
        },
      });
      expect(result.id).toBe('uuid-123');
    });

    it('should throw EmailAlreadyExistsError when email exists', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockCreatedUser);

      await expect(register(validInput)).rejects.toThrow(EmailAlreadyExistsError);
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('should return user without passwordHash field', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (mockBcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      (mockPrisma.user.create as jest.Mock).mockResolvedValue(mockCreatedUser);

      const result = await register(validInput);

      expect(result).not.toHaveProperty('passwordHash');
      expect(result.email).toBe('test@example.com');
    });

    it('should set default role to TARGET', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (mockBcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      (mockPrisma.user.create as jest.Mock).mockResolvedValue(mockCreatedUser);

      const result = await register(validInput);

      expect(result.role).toBe('TARGET');
    });

    it('should normalize email to lowercase', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (mockBcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      (mockPrisma.user.create as jest.Mock).mockResolvedValue({
        ...mockCreatedUser,
        email: 'test@example.com',
      });

      await register({ ...validInput, email: 'TEST@EXAMPLE.COM' });

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should create user with optional fields as undefined', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (mockBcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      (mockPrisma.user.create as jest.Mock).mockResolvedValue({
        ...mockCreatedUser,
        firstName: null,
        lastName: null,
      });

      await register({ email: 'test@example.com', password: 'Password123!' });

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          passwordHash: 'hashed_password',
          firstName: undefined,
          lastName: undefined,
        },
      });
    });
  });

  describe('login', () => {
    const validInput = {
      email: 'test@example.com',
      password: 'Password123!',
    };

    const mockExistingUser = {
      id: 'uuid-123',
      email: 'test@example.com',
      passwordHash: 'hashed_password',
      firstName: 'John',
      lastName: 'Doe',
      phone: null,
      role: 'TARGET' as UserRole,
      isActive: true,
      stripeCustomerId: null,
      emailVerifiedAt: null,
      passwordResetToken: null,
      passwordResetExpires: null,
      lastLoginAt: null,
      refreshTokenHash: null,
      createdAt: new Date('2026-02-05'),
      updatedAt: new Date('2026-02-05'),
      deletedAt: null,
    };

    it('should return user when credentials are valid', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockExistingUser);
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({
        ...mockExistingUser,
        lastLoginAt: new Date(),
      });

      const result = await login(validInput);

      expect(result.id).toBe('uuid-123');
      expect(result.email).toBe('test@example.com');
    });

    it('should update lastLoginAt on successful login', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockExistingUser);
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({
        ...mockExistingUser,
        lastLoginAt: new Date(),
      });

      await login(validInput);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'uuid-123' },
        data: { lastLoginAt: expect.any(Date) },
      });
    });

    it('should throw InvalidCredentialsError when email not found', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(login(validInput)).rejects.toThrow(InvalidCredentialsError);
      expect(mockBcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw InvalidCredentialsError when password is wrong', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockExistingUser);
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(login(validInput)).rejects.toThrow(InvalidCredentialsError);
    });

    it('should throw UserNotActiveError when user is inactive', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockExistingUser,
        isActive: false,
      });

      await expect(login(validInput)).rejects.toThrow(UserNotActiveError);
      // Verify password check is NOT called (timing attack mitigation)
      expect(mockBcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw UserNotActiveError when user is soft-deleted', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockExistingUser,
        deletedAt: new Date(),
      });

      await expect(login(validInput)).rejects.toThrow(UserNotActiveError);
      // Verify password check is NOT called (timing attack mitigation)
      expect(mockBcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw InvalidCredentialsError when passwordHash is null', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockExistingUser,
        passwordHash: null,
      });

      await expect(login(validInput)).rejects.toThrow(InvalidCredentialsError);
    });

    it('should return user without passwordHash field', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockExistingUser);
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({
        ...mockExistingUser,
        lastLoginAt: new Date(),
      });

      const result = await login(validInput);

      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should normalize email to lowercase for lookup', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockExistingUser);
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({
        ...mockExistingUser,
        lastLoginAt: new Date(),
      });

      await login({ email: 'TEST@EXAMPLE.COM', password: 'Password123!' });

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });
  });

  describe('logout', () => {
    const userId = 'uuid-123';

    const mockExistingUser = {
      id: 'uuid-123',
      email: 'test@example.com',
      passwordHash: 'hashed_password',
      firstName: 'John',
      lastName: 'Doe',
      phone: null,
      role: 'TARGET' as UserRole,
      isActive: true,
      stripeCustomerId: null,
      emailVerifiedAt: null,
      passwordResetToken: null,
      passwordResetExpires: null,
      lastLoginAt: new Date(),
      refreshTokenHash: 'hashed_refresh_token',
      createdAt: new Date('2026-02-05'),
      updatedAt: new Date('2026-02-05'),
      deletedAt: null,
    };

    it('should clear refreshTokenHash for the user', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockExistingUser);
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({
        ...mockExistingUser,
        refreshTokenHash: null,
      });

      await logout(userId);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { refreshTokenHash: null },
      });
    });

    it('should throw UserNotFoundError when user does not exist', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(logout(userId)).rejects.toThrow(UserNotFoundError);
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('should succeed even if refreshTokenHash is already null', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockExistingUser,
        refreshTokenHash: null,
      });
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({
        ...mockExistingUser,
        refreshTokenHash: null,
      });

      await expect(logout(userId)).resolves.not.toThrow();
    });
  });

  describe('requestPasswordReset', () => {
    const mockExistingUser = {
      id: 'uuid-123',
      email: 'test@example.com',
      passwordHash: 'hashed_password',
      firstName: 'John',
      lastName: 'Doe',
      phone: null,
      role: 'TARGET' as UserRole,
      isActive: true,
      stripeCustomerId: null,
      emailVerifiedAt: null,
      passwordResetToken: null,
      passwordResetExpires: null,
      lastLoginAt: null,
      refreshTokenHash: null,
      createdAt: new Date('2026-02-05'),
      updatedAt: new Date('2026-02-05'),
      deletedAt: null,
    };

    it('should generate and store hashed token when user exists', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockExistingUser);
      (mockBcrypt.hash as jest.Mock).mockResolvedValue('hashed_reset_token');
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({
        ...mockExistingUser,
        passwordResetToken: 'hashed_reset_token',
        passwordResetExpires: new Date(),
      });

      await requestPasswordReset('test@example.com');

      expect(mockBcrypt.hash).toHaveBeenCalledWith('a'.repeat(64), 10);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'uuid-123' },
        data: {
          passwordResetToken: 'hashed_reset_token',
          passwordResetExpires: expect.any(Date),
        },
      });
    });

    it('should not throw when user does not exist (security)', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(requestPasswordReset('nonexistent@example.com')).resolves.not.toThrow();
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('should normalize email to lowercase', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockExistingUser);
      (mockBcrypt.hash as jest.Mock).mockResolvedValue('hashed_reset_token');
      (mockPrisma.user.update as jest.Mock).mockResolvedValue(mockExistingUser);

      await requestPasswordReset('TEST@EXAMPLE.COM');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should set expiration to 1 hour from now', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockExistingUser);
      (mockBcrypt.hash as jest.Mock).mockResolvedValue('hashed_reset_token');
      (mockPrisma.user.update as jest.Mock).mockResolvedValue(mockExistingUser);

      const beforeCall = Date.now();
      await requestPasswordReset('test@example.com');
      const afterCall = Date.now();

      const updateCall = (mockPrisma.user.update as jest.Mock).mock.calls[0][0];
      const expiresAt = updateCall.data.passwordResetExpires.getTime();
      const oneHourMs = 60 * 60 * 1000;

      expect(expiresAt).toBeGreaterThanOrEqual(beforeCall + oneHourMs);
      expect(expiresAt).toBeLessThanOrEqual(afterCall + oneHourMs);
    });

    it('should return the plain token for logging/email', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockExistingUser);
      (mockBcrypt.hash as jest.Mock).mockResolvedValue('hashed_reset_token');
      (mockPrisma.user.update as jest.Mock).mockResolvedValue(mockExistingUser);

      const result = await requestPasswordReset('test@example.com');

      expect(result).toBe('a'.repeat(64));
    });

    it('should return null when user does not exist', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await requestPasswordReset('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('resetPassword', () => {
    const validToken = 'a'.repeat(64);
    const newPassword = 'NewPassword123!';

    const mockUserWithResetToken = {
      id: 'uuid-123',
      email: 'test@example.com',
      passwordHash: 'old_hashed_password',
      firstName: 'John',
      lastName: 'Doe',
      phone: null,
      role: 'TARGET' as UserRole,
      isActive: true,
      stripeCustomerId: null,
      emailVerifiedAt: null,
      passwordResetToken: 'hashed_reset_token',
      passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      lastLoginAt: null,
      refreshTokenHash: null,
      createdAt: new Date('2026-02-05'),
      updatedAt: new Date('2026-02-05'),
      deletedAt: null,
    };

    beforeEach(() => {
      (mockPrisma.user.findFirst as jest.Mock) = jest.fn();
    });

    it('should update password when token is valid', async () => {
      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(mockUserWithResetToken);
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);
      (mockBcrypt.hash as jest.Mock).mockResolvedValue('new_hashed_password');
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUserWithResetToken,
        passwordHash: 'new_hashed_password',
        passwordResetToken: null,
        passwordResetExpires: null,
      });

      await resetPassword(validToken, newPassword);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'uuid-123' },
        data: {
          passwordHash: 'new_hashed_password',
          passwordResetToken: null,
          passwordResetExpires: null,
        },
      });
    });

    it('should throw PasswordResetTokenInvalidError when no user found with reset token', async () => {
      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(resetPassword(validToken, newPassword)).rejects.toThrow(
        PasswordResetTokenInvalidError
      );
    });

    it('should throw PasswordResetTokenInvalidError when token does not match', async () => {
      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(mockUserWithResetToken);
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(resetPassword(validToken, newPassword)).rejects.toThrow(
        PasswordResetTokenInvalidError
      );
    });

    it('should throw PasswordResetTokenExpiredError when token is expired', async () => {
      const expiredUser = {
        ...mockUserWithResetToken,
        passwordResetExpires: new Date(Date.now() - 1000), // 1 second ago
      };
      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(expiredUser);
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(resetPassword(validToken, newPassword)).rejects.toThrow(
        PasswordResetTokenExpiredError
      );
    });

    it('should hash new password with cost factor 12', async () => {
      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(mockUserWithResetToken);
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);
      (mockBcrypt.hash as jest.Mock).mockResolvedValue('new_hashed_password');
      (mockPrisma.user.update as jest.Mock).mockResolvedValue(mockUserWithResetToken);

      await resetPassword(validToken, newPassword);

      expect(mockBcrypt.hash).toHaveBeenCalledWith(newPassword, 12);
    });

    it('should clear reset token fields after successful reset', async () => {
      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(mockUserWithResetToken);
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);
      (mockBcrypt.hash as jest.Mock).mockResolvedValue('new_hashed_password');
      (mockPrisma.user.update as jest.Mock).mockResolvedValue(mockUserWithResetToken);

      await resetPassword(validToken, newPassword);

      const updateCall = (mockPrisma.user.update as jest.Mock).mock.calls[0][0];
      expect(updateCall.data.passwordResetToken).toBeNull();
      expect(updateCall.data.passwordResetExpires).toBeNull();
    });
  });
});
