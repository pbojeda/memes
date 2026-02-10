import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../application/services/tokenService';
import { TokenExpiredError, InvalidTokenError } from '../domain/errors/AuthError';

/**
 * Express middleware for optional JWT authentication.
 * Extracts Bearer token from Authorization header and verifies it.
 * Attaches decoded payload to req.user on success.
 * Silently passes through if token is missing or invalid.
 *
 * Used for endpoints that are public but role-aware (e.g., GET /product-types).
 */
export function optionalAuthMiddleware(req: Request, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || authHeader.trim() === '') {
      next();
      return;
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      next();
      return;
    }

    const token = parts[1];

    if (!token) {
      next();
      return;
    }

    const payload = verifyAccessToken(token);
    req.user = payload;

    next();
  } catch (error) {
    // Silently ignore all token verification errors
    if (error instanceof TokenExpiredError || error instanceof InvalidTokenError) {
      next();
    } else {
      // Also pass through for any other error
      next();
    }
  }
}
