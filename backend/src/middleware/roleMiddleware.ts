import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../generated/prisma/enums';
import { ForbiddenError, UnauthorizedError } from './errorHandler';

/**
 * Middleware factory that restricts access based on user roles.
 * Must be used after authMiddleware which sets req.user.
 *
 * @param allowedRoles - Single role or array of roles that can access the route
 * @returns Express middleware function
 *
 * @example
 * // Single role
 * router.get('/admin', authMiddleware, requireRole(UserRole.ADMIN), handler);
 *
 * // Multiple roles
 * router.get('/dashboard', authMiddleware, requireRole([UserRole.ADMIN, UserRole.MANAGER]), handler);
 */
export function requireRole(
  allowedRoles: UserRole | UserRole[]
): (req: Request, res: Response, next: NextFunction) => void {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req: Request, _res: Response, next: NextFunction): void => {
    // Defensive check - authMiddleware should have set req.user
    if (!req.user) {
      next(new UnauthorizedError('Authentication required'));
      return;
    }

    const userRole = req.user.role;

    if (!roles.includes(userRole)) {
      next(new ForbiddenError('Access denied'));
      return;
    }

    next();
  };
}
