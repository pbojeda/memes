import bcrypt from 'bcrypt';
import { register, login, logout } from './authService';
import prisma from '../../lib/prisma';
import {
  InvalidCredentialsError,
  EmailAlreadyExistsError,
  UserNotActiveError,
  UserNotFoundError,
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
});
