import { Request, Response, NextFunction } from 'express';
import { authMiddleware } from './authMiddleware';
import * as tokenService from '../application/services/tokenService';
import { TokenExpiredError, InvalidTokenError } from '../domain/errors/AuthError';
import { UserRole } from '../generated/prisma/enums';

// Mock tokenService
jest.mock('../application/services/tokenService');

describe('authMiddleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  const validPayload: tokenService.TokenPayload = {
    userId: 'user-123',
    email: 'test@example.com',
    role: UserRole.TARGET,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {
      headers: {},
    };
    mockResponse = {};
    mockNext = jest.fn();
  });

  describe('Happy path', () => {
    it('should call next() when valid token is provided', () => {
      mockRequest.headers = { authorization: 'Bearer valid.jwt.token' };
      (tokenService.verifyAccessToken as jest.Mock).mockReturnValue(validPayload);

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should attach decoded payload to req.user', () => {
      mockRequest.headers = { authorization: 'Bearer valid.jwt.token' };
      (tokenService.verifyAccessToken as jest.Mock).mockReturnValue(validPayload);

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.user).toEqual(validPayload);
    });

    it('should extract token from Bearer authorization header', () => {
      const token = 'my.jwt.token';
      mockRequest.headers = { authorization: `Bearer ${token}` };
      (tokenService.verifyAccessToken as jest.Mock).mockReturnValue(validPayload);

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(tokenService.verifyAccessToken).toHaveBeenCalledWith(token);
    });
  });

  describe('Missing token', () => {
    it('should call next with 401 error when Authorization header is missing', () => {
      mockRequest.headers = {};

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      const error = mockNext.mock.calls[0][0] as unknown as Error & { statusCode?: number };
      expect(error).toBeInstanceOf(Error);
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Authorization header is required');
    });

    it('should call next with 401 error when Authorization header is empty', () => {
      mockRequest.headers = { authorization: '' };

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      const error = mockNext.mock.calls[0][0] as unknown as Error & { statusCode?: number };
      expect(error).toBeInstanceOf(Error);
      expect(error.statusCode).toBe(401);
    });
  });

  describe('Malformed header', () => {
    it('should call next with 401 error when Authorization is not Bearer type', () => {
      mockRequest.headers = { authorization: 'Basic some-credentials' };

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      const error = mockNext.mock.calls[0][0] as unknown as Error & { statusCode?: number };
      expect(error).toBeInstanceOf(Error);
      expect(error.statusCode).toBe(401);
      expect(error.message).toContain('Invalid authorization format');
    });

    it('should call next with 401 error when Bearer token is missing after "Bearer "', () => {
      mockRequest.headers = { authorization: 'Bearer ' };

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      const error = mockNext.mock.calls[0][0] as unknown as Error & { statusCode?: number };
      expect(error).toBeInstanceOf(Error);
      expect(error.statusCode).toBe(401);
    });

    it('should call next with 401 error when only "Bearer" without space', () => {
      mockRequest.headers = { authorization: 'Bearer' };

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      const error = mockNext.mock.calls[0][0] as unknown as Error & { statusCode?: number };
      expect(error).toBeInstanceOf(Error);
      expect(error.statusCode).toBe(401);
    });
  });

  describe('Invalid token', () => {
    it('should call next with 401 error when token verification fails with InvalidTokenError', () => {
      mockRequest.headers = { authorization: 'Bearer invalid.token' };
      (tokenService.verifyAccessToken as jest.Mock).mockImplementation(() => {
        throw new InvalidTokenError();
      });

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      const error = mockNext.mock.calls[0][0] as unknown as Error & { statusCode?: number };
      expect(error).toBeInstanceOf(Error);
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Invalid token');
    });

    it('should call next with 401 error when token is expired', () => {
      mockRequest.headers = { authorization: 'Bearer expired.token' };
      (tokenService.verifyAccessToken as jest.Mock).mockImplementation(() => {
        throw new TokenExpiredError();
      });

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      const error = mockNext.mock.calls[0][0] as unknown as Error & { statusCode?: number };
      expect(error).toBeInstanceOf(Error);
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Token has expired');
    });
  });

  describe('Error propagation', () => {
    it('should call next with the error for unexpected errors', () => {
      mockRequest.headers = { authorization: 'Bearer valid.token' };
      const unexpectedError = new Error('Database connection failed');
      (tokenService.verifyAccessToken as jest.Mock).mockImplementation(() => {
        throw unexpectedError;
      });

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(unexpectedError);
    });
  });
});
