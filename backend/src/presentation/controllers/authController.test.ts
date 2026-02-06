import { Request, Response, NextFunction } from 'express';
import { register, login, logout, refresh, forgotPassword, resetPassword } from './authController';
import * as authService from '../../application/services/authService';
import * as tokenService from '../../application/services/tokenService';
import * as authValidator from '../../application/validators/authValidator';
import {
  InvalidCredentialsError,
  EmailAlreadyExistsError,
  UserNotActiveError,
  UserNotFoundError,
  ValidationError,
  InvalidTokenError,
  PasswordResetTokenInvalidError,
  PasswordResetTokenExpiredError,
} from '../../domain/errors/AuthError';
import { UserRole } from '../../generated/prisma/enums';

jest.mock('../../application/services/authService');
jest.mock('../../application/services/tokenService');
jest.mock('../../application/validators/authValidator');

describe('authController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  const mockUser: authService.AuthUser = {
    id: 'user-uuid-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.TARGET,
    isActive: true,
    emailVerifiedAt: null,
    lastLoginAt: null,
    createdAt: new Date('2026-02-06'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };
    mockNext = jest.fn();
  });

  describe('register', () => {
    beforeEach(() => {
      mockRequest = {
        body: {
          email: 'test@example.com',
          password: 'SecurePass123!',
          firstName: 'John',
          lastName: 'Doe',
        },
      };
    });

    it('should return 201 with user data on successful registration', async () => {
      const validatedInput = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
      };
      (authValidator.validateRegisterInput as jest.Mock).mockReturnValue(validatedInput);
      (authService.register as jest.Mock).mockResolvedValue(mockUser);

      await register(mockRequest as Request, mockResponse as Response, mockNext);

      expect(authValidator.validateRegisterInput).toHaveBeenCalledWith(mockRequest.body);
      expect(authService.register).toHaveBeenCalledWith(validatedInput);
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockUser,
      });
    });

    it('should return 400 when validation fails', async () => {
      const validationError = new ValidationError('Email is required', 'email');
      (authValidator.validateRegisterInput as jest.Mock).mockImplementation(() => {
        throw validationError;
      });

      await register(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Email is required',
          code: 'VALIDATION_ERROR',
          field: 'email',
        },
      });
    });

    it('should return 409 when email already exists', async () => {
      (authValidator.validateRegisterInput as jest.Mock).mockReturnValue(mockRequest.body);
      (authService.register as jest.Mock).mockRejectedValue(new EmailAlreadyExistsError());

      await register(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Email already registered',
          code: 'EMAIL_ALREADY_EXISTS',
        },
      });
    });

    it('should call next(error) for unexpected errors', async () => {
      const unexpectedError = new Error('Database connection failed');
      (authValidator.validateRegisterInput as jest.Mock).mockReturnValue(mockRequest.body);
      (authService.register as jest.Mock).mockRejectedValue(unexpectedError);

      await register(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(unexpectedError);
    });
  });

  describe('login', () => {
    beforeEach(() => {
      mockRequest = {
        body: {
          email: 'test@example.com',
          password: 'SecurePass123!',
        },
      };
    });

    it('should return 200 with tokens and user data on successful login', async () => {
      const validatedInput = { email: 'test@example.com', password: 'SecurePass123!' };
      (authValidator.validateLoginInput as jest.Mock).mockReturnValue(validatedInput);
      (authService.login as jest.Mock).mockResolvedValue(mockUser);
      (tokenService.generateAccessToken as jest.Mock).mockReturnValue('access.token.here');
      (tokenService.generateRefreshToken as jest.Mock).mockResolvedValue('refresh-token-here');

      await login(mockRequest as Request, mockResponse as Response, mockNext);

      expect(authValidator.validateLoginInput).toHaveBeenCalledWith(mockRequest.body);
      expect(authService.login).toHaveBeenCalledWith(validatedInput);
      expect(tokenService.generateAccessToken).toHaveBeenCalledWith(mockUser);
      expect(tokenService.generateRefreshToken).toHaveBeenCalledWith(mockUser.id);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          user: mockUser,
          accessToken: 'access.token.here',
          refreshToken: 'refresh-token-here',
        },
      });
    });

    it('should return 400 when validation fails', async () => {
      const validationError = new ValidationError('Password is required', 'password');
      (authValidator.validateLoginInput as jest.Mock).mockImplementation(() => {
        throw validationError;
      });

      await login(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Password is required',
          code: 'VALIDATION_ERROR',
          field: 'password',
        },
      });
    });

    it('should return 401 when credentials are invalid', async () => {
      (authValidator.validateLoginInput as jest.Mock).mockReturnValue(mockRequest.body);
      (authService.login as jest.Mock).mockRejectedValue(new InvalidCredentialsError());

      await login(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS',
        },
      });
    });

    it('should return 401 when user is not active', async () => {
      (authValidator.validateLoginInput as jest.Mock).mockReturnValue(mockRequest.body);
      (authService.login as jest.Mock).mockRejectedValue(new UserNotActiveError());

      await login(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'User account is not active',
          code: 'USER_NOT_ACTIVE',
        },
      });
    });

    it('should call next(error) for unexpected errors', async () => {
      const unexpectedError = new Error('Database connection failed');
      (authValidator.validateLoginInput as jest.Mock).mockReturnValue(mockRequest.body);
      (authService.login as jest.Mock).mockRejectedValue(unexpectedError);

      await login(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(unexpectedError);
    });
  });

  describe('logout', () => {
    beforeEach(() => {
      mockRequest = {
        user: { userId: 'user-uuid-123', email: 'test@example.com', role: UserRole.TARGET },
      };
    });

    it('should return 200 on successful logout', async () => {
      (authService.logout as jest.Mock).mockResolvedValue(undefined);

      await logout(mockRequest as Request, mockResponse as Response, mockNext);

      expect(authService.logout).toHaveBeenCalledWith('user-uuid-123');
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          message: 'Logged out successfully',
        },
      });
    });

    it('should return 404 when user not found', async () => {
      (authService.logout as jest.Mock).mockRejectedValue(new UserNotFoundError());

      await logout(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'User not found',
          code: 'USER_NOT_FOUND',
        },
      });
    });

    it('should call next(error) for unexpected errors', async () => {
      const unexpectedError = new Error('Database connection failed');
      (authService.logout as jest.Mock).mockRejectedValue(unexpectedError);

      await logout(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(unexpectedError);
    });

    it('should return 401 when req.user is missing (defensive check)', async () => {
      mockRequest = {}; // No user attached

      await logout(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Authentication required',
          code: 'UNAUTHORIZED',
        },
      });
    });
  });

  describe('refresh', () => {
    const validRefreshToken = 'a'.repeat(64); // 64 hex chars (32 bytes)
    const validUserId = '123e4567-e89b-12d3-a456-426614174000'; // Valid UUID

    beforeEach(() => {
      mockRequest = {
        body: {
          refreshToken: validRefreshToken,
          userId: validUserId,
        },
      };
    });

    it('should return 200 with new tokens on successful refresh', async () => {
      const validatedInput = { refreshToken: validRefreshToken, userId: validUserId };
      const newTokens = {
        accessToken: 'new.access.token',
        refreshToken: 'new-refresh-token',
      };
      (authValidator.validateRefreshInput as jest.Mock).mockReturnValue(validatedInput);
      (tokenService.refreshTokens as jest.Mock).mockResolvedValue(newTokens);

      await refresh(mockRequest as Request, mockResponse as Response, mockNext);

      expect(authValidator.validateRefreshInput).toHaveBeenCalledWith(mockRequest.body);
      expect(tokenService.refreshTokens).toHaveBeenCalledWith(validRefreshToken, validUserId);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: newTokens,
      });
    });

    it('should return 400 when validation fails', async () => {
      const validationError = new ValidationError('Refresh token is required', 'refreshToken');
      (authValidator.validateRefreshInput as jest.Mock).mockImplementation(() => {
        throw validationError;
      });

      await refresh(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Refresh token is required',
          code: 'VALIDATION_ERROR',
          field: 'refreshToken',
        },
      });
    });

    it('should return 401 when refresh token is invalid', async () => {
      const validatedInput = { refreshToken: validRefreshToken, userId: validUserId };
      (authValidator.validateRefreshInput as jest.Mock).mockReturnValue(validatedInput);
      (tokenService.refreshTokens as jest.Mock).mockRejectedValue(new InvalidTokenError());

      await refresh(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Invalid token',
          code: 'INVALID_TOKEN',
        },
      });
    });

    it('should call next(error) for unexpected errors', async () => {
      const validatedInput = { refreshToken: validRefreshToken, userId: validUserId };
      const unexpectedError = new Error('Database connection failed');
      (authValidator.validateRefreshInput as jest.Mock).mockReturnValue(validatedInput);
      (tokenService.refreshTokens as jest.Mock).mockRejectedValue(unexpectedError);

      await refresh(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(unexpectedError);
    });
  });

  describe('forgotPassword', () => {
    beforeEach(() => {
      mockRequest = {
        body: {
          email: 'test@example.com',
        },
      };
    });

    it('should return 200 with generic message on successful request', async () => {
      const validatedInput = { email: 'test@example.com' };
      (authValidator.validateForgotPasswordInput as jest.Mock).mockReturnValue(validatedInput);
      (authService.requestPasswordReset as jest.Mock).mockResolvedValue('reset-token-123');

      await forgotPassword(mockRequest as Request, mockResponse as Response, mockNext);

      expect(authValidator.validateForgotPasswordInput).toHaveBeenCalledWith(mockRequest.body);
      expect(authService.requestPasswordReset).toHaveBeenCalledWith('test@example.com');
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          message: 'If an account with that email exists, a password reset link has been sent.',
        },
      });
    });

    it('should return 200 with same message when user does not exist (security)', async () => {
      const validatedInput = { email: 'nonexistent@example.com' };
      (authValidator.validateForgotPasswordInput as jest.Mock).mockReturnValue(validatedInput);
      (authService.requestPasswordReset as jest.Mock).mockResolvedValue(null);

      await forgotPassword(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          message: 'If an account with that email exists, a password reset link has been sent.',
        },
      });
    });

    it('should return 400 when validation fails', async () => {
      const validationError = new ValidationError('Email is required', 'email');
      (authValidator.validateForgotPasswordInput as jest.Mock).mockImplementation(() => {
        throw validationError;
      });

      await forgotPassword(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Email is required',
          code: 'VALIDATION_ERROR',
          field: 'email',
        },
      });
    });

    it('should call next(error) for unexpected errors', async () => {
      const validatedInput = { email: 'test@example.com' };
      const unexpectedError = new Error('Database connection failed');
      (authValidator.validateForgotPasswordInput as jest.Mock).mockReturnValue(validatedInput);
      (authService.requestPasswordReset as jest.Mock).mockRejectedValue(unexpectedError);

      await forgotPassword(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(unexpectedError);
    });
  });

  describe('resetPassword', () => {
    const validToken = 'a'.repeat(64);

    beforeEach(() => {
      mockRequest = {
        body: {
          token: validToken,
          newPassword: 'NewPassword123!',
        },
      };
    });

    it('should return 200 on successful password reset', async () => {
      const validatedInput = { token: validToken, newPassword: 'NewPassword123!' };
      (authValidator.validateResetPasswordInput as jest.Mock).mockReturnValue(validatedInput);
      (authService.resetPassword as jest.Mock).mockResolvedValue(undefined);

      await resetPassword(mockRequest as Request, mockResponse as Response, mockNext);

      expect(authValidator.validateResetPasswordInput).toHaveBeenCalledWith(mockRequest.body);
      expect(authService.resetPassword).toHaveBeenCalledWith(validToken, 'NewPassword123!');
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          message: 'Password has been reset successfully.',
        },
      });
    });

    it('should return 400 when validation fails', async () => {
      const validationError = new ValidationError('Reset token is required', 'token');
      (authValidator.validateResetPasswordInput as jest.Mock).mockImplementation(() => {
        throw validationError;
      });

      await resetPassword(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Reset token is required',
          code: 'VALIDATION_ERROR',
          field: 'token',
        },
      });
    });

    it('should return 400 when token is invalid', async () => {
      const validatedInput = { token: validToken, newPassword: 'NewPassword123!' };
      (authValidator.validateResetPasswordInput as jest.Mock).mockReturnValue(validatedInput);
      (authService.resetPassword as jest.Mock).mockRejectedValue(new PasswordResetTokenInvalidError());

      await resetPassword(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Invalid password reset token',
          code: 'PASSWORD_RESET_TOKEN_INVALID',
        },
      });
    });

    it('should return 400 when token is expired', async () => {
      const validatedInput = { token: validToken, newPassword: 'NewPassword123!' };
      (authValidator.validateResetPasswordInput as jest.Mock).mockReturnValue(validatedInput);
      (authService.resetPassword as jest.Mock).mockRejectedValue(new PasswordResetTokenExpiredError());

      await resetPassword(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Password reset token has expired',
          code: 'PASSWORD_RESET_TOKEN_EXPIRED',
        },
      });
    });

    it('should call next(error) for unexpected errors', async () => {
      const validatedInput = { token: validToken, newPassword: 'NewPassword123!' };
      const unexpectedError = new Error('Database connection failed');
      (authValidator.validateResetPasswordInput as jest.Mock).mockReturnValue(validatedInput);
      (authService.resetPassword as jest.Mock).mockRejectedValue(unexpectedError);

      await resetPassword(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(unexpectedError);
    });
  });
});
