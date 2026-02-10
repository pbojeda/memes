import { Request, Response, NextFunction } from 'express';
import { optionalAuthMiddleware } from './optionalAuthMiddleware';
import * as tokenService from '../application/services/tokenService';
import { TokenExpiredError, InvalidTokenError } from '../domain/errors/AuthError';
import { UserRole } from '../generated/prisma/enums';

// Mock tokenService
jest.mock('../application/services/tokenService');

describe('optionalAuthMiddleware', () => {
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

  it('should call next() without setting req.user when no Authorization header', () => {
    mockRequest.headers = {};

    optionalAuthMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockRequest.user).toBeUndefined();
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('should call next() without setting req.user when Authorization header is empty', () => {
    mockRequest.headers = { authorization: '' };

    optionalAuthMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockRequest.user).toBeUndefined();
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('should call next() without setting req.user when token is invalid', () => {
    mockRequest.headers = { authorization: 'Bearer invalid.token' };
    (tokenService.verifyAccessToken as jest.Mock).mockImplementation(() => {
      throw new InvalidTokenError();
    });

    optionalAuthMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockRequest.user).toBeUndefined();
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('should call next() without setting req.user when token is expired', () => {
    mockRequest.headers = { authorization: 'Bearer expired.token' };
    (tokenService.verifyAccessToken as jest.Mock).mockImplementation(() => {
      throw new TokenExpiredError();
    });

    optionalAuthMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockRequest.user).toBeUndefined();
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('should set req.user and call next() when valid token is provided', () => {
    mockRequest.headers = { authorization: 'Bearer valid.jwt.token' };
    (tokenService.verifyAccessToken as jest.Mock).mockReturnValue(validPayload);

    optionalAuthMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockRequest.user).toEqual(validPayload);
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('should call next() without setting req.user when Authorization format is not Bearer', () => {
    mockRequest.headers = { authorization: 'Basic some-credentials' };

    optionalAuthMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockRequest.user).toBeUndefined();
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('should call next() without setting req.user when Bearer token is empty', () => {
    mockRequest.headers = { authorization: 'Bearer ' };

    optionalAuthMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockRequest.user).toBeUndefined();
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('should call next() without setting req.user for unexpected errors', () => {
    mockRequest.headers = { authorization: 'Bearer valid.token' };
    const unexpectedError = new Error('Database connection failed');
    (tokenService.verifyAccessToken as jest.Mock).mockImplementation(() => {
      throw unexpectedError;
    });

    optionalAuthMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockRequest.user).toBeUndefined();
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith();
  });
});
