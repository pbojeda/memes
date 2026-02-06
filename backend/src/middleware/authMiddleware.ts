import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../application/services/tokenService';
import { TokenExpiredError, InvalidTokenError } from '../domain/errors/AuthError';
import { UnauthorizedError } from './errorHandler';

/**
 * Express middleware for JWT authentication.
 * Extracts Bearer token from Authorization header and verifies it.
 * Attaches decoded payload to req.user on success.
 *
 * @throws {UnauthorizedError} When token is missing, invalid, or expired
 */
export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedError('Authorization header is required');
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new UnauthorizedError('Invalid authorization format. Use: Bearer <token>');
    }

    const token = parts[1];

    if (!token) {
      throw new UnauthorizedError('Token is required');
    }

    const payload = verifyAccessToken(token);
    req.user = payload;

    next();
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      next(new UnauthorizedError('Token has expired'));
    } else if (error instanceof InvalidTokenError) {
      next(new UnauthorizedError('Invalid token'));
    } else if (error instanceof UnauthorizedError) {
      next(error);
    } else {
      next(error);
    }
  }
}
