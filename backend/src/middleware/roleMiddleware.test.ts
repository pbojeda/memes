import { Request, Response, NextFunction } from 'express';
import { requireRole } from './roleMiddleware';
import { AppError } from './errorHandler';
import { UserRole } from '../generated/prisma/enums';

describe('roleMiddleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {};
    mockNext = jest.fn();
  });

  describe('requireRole', () => {
    describe('successful access', () => {
      it('should call next() when user has exact required role', () => {
        mockRequest.user = {
          userId: 'user-123',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        };

        const middleware = requireRole(UserRole.ADMIN);
        middleware(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith();
        expect(mockNext).toHaveBeenCalledTimes(1);
      });

      it('should call next() when user has one of multiple allowed roles', () => {
        mockRequest.user = {
          userId: 'user-123',
          email: 'manager@example.com',
          role: UserRole.MANAGER,
        };

        const middleware = requireRole([UserRole.ADMIN, UserRole.MANAGER]);
        middleware(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith();
      });

      it('should work with single role parameter', () => {
        mockRequest.user = {
          userId: 'user-123',
          email: 'marketing@example.com',
          role: UserRole.MARKETING,
        };

        const middleware = requireRole(UserRole.MARKETING);
        middleware(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith();
      });

      it('should work with array containing single role', () => {
        mockRequest.user = {
          userId: 'user-123',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        };

        const middleware = requireRole([UserRole.ADMIN]);
        middleware(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith();
      });
    });

    describe('access denied', () => {
      it('should call next with 403 error when user role not in allowed roles', () => {
        mockRequest.user = {
          userId: 'user-123',
          email: 'target@example.com',
          role: UserRole.TARGET,
        };

        const middleware = requireRole(UserRole.ADMIN);
        middleware(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledTimes(1);
        const error = mockNext.mock.calls[0][0] as unknown as AppError;
        expect(error).toBeInstanceOf(AppError);
        expect(error.message).toBe('Access denied');
        expect(error.statusCode).toBe(403);
      });

      it('should call next with 403 error when user role not in multiple allowed roles', () => {
        mockRequest.user = {
          userId: 'user-123',
          email: 'target@example.com',
          role: UserRole.TARGET,
        };

        const middleware = requireRole([UserRole.ADMIN, UserRole.MANAGER]);
        middleware(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledTimes(1);
        const error = mockNext.mock.calls[0][0] as unknown as AppError;
        expect(error).toBeInstanceOf(AppError);
        expect(error.statusCode).toBe(403);
      });

      it('should deny MARKETING user access to ADMIN-only route', () => {
        mockRequest.user = {
          userId: 'user-123',
          email: 'marketing@example.com',
          role: UserRole.MARKETING,
        };

        const middleware = requireRole(UserRole.ADMIN);
        middleware(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledTimes(1);
        const error = mockNext.mock.calls[0][0] as unknown as AppError;
        expect(error).toBeInstanceOf(AppError);
        expect(error.statusCode).toBe(403);
      });
    });

    describe('edge cases', () => {
      it('should call next with 401 error when req.user is undefined', () => {
        mockRequest.user = undefined;

        const middleware = requireRole(UserRole.ADMIN);
        middleware(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledTimes(1);
        const error = mockNext.mock.calls[0][0] as unknown as AppError;
        expect(error).toBeInstanceOf(AppError);
        expect(error.message).toBe('Authentication required');
        expect(error.statusCode).toBe(401);
      });

      it('should work with all four role types', () => {
        const roles = [UserRole.TARGET, UserRole.MANAGER, UserRole.ADMIN, UserRole.MARKETING];

        roles.forEach((role) => {
          mockRequest.user = {
            userId: 'user-123',
            email: 'test@example.com',
            role,
          };

          const middleware = requireRole(role);
          mockNext.mockClear();
          middleware(mockRequest as Request, mockResponse as Response, mockNext);

          expect(mockNext).toHaveBeenCalledWith();
        });
      });
    });
  });
});
