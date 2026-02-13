import { Request, Response, NextFunction } from 'express';
import * as productService from '../../application/services/productService';
import {
  InvalidProductDataError,
  ProductNotFoundError,
  ProductSlugAlreadyExistsError,
} from '../../domain/errors/ProductError';
import { success, noContent, created } from '../../utils/responseHelpers';
import { UserRole } from '../../generated/prisma/enums';

/**
 * Handle product detail retrieval by slug or ID.
 * GET /api/products/:slug
 *
 * Public endpoint (no auth required) when accessed by slug.
 * Admin endpoint (with optional auth) when accessed by UUID - includes soft-deleted products.
 */
export async function getProductDetail(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const param = req.params.slug as string;

    // Check if param is a UUID (36 chars with dashes in specific positions)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(param);

    if (isUUID) {
      // Admin access by ID - requires MANAGER/ADMIN role, includes soft-deleted
      const userRole = req.user?.role;
      if (userRole !== UserRole.MANAGER && userRole !== UserRole.ADMIN) {
        res.status(403).json({
          success: false,
          error: {
            message: 'Insufficient permissions',
            code: 'FORBIDDEN',
          },
        });
        return;
      }

      const product = await productService.getProductById(param, true);
      success(res, product);
    } else {
      // Public access by slug
      const product = await productService.getProductDetailBySlug(param);
      success(res, product);
    }
  } catch (error) {
    handleProductError(error, res, next);
  }
}

/**
 * Handle product soft deletion.
 * DELETE /api/products/:id
 *
 * Requires authentication and MANAGER/ADMIN role.
 */
export async function deleteProduct(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id as string;
    await productService.softDeleteProduct(id);
    noContent(res);
  } catch (error) {
    handleProductError(error, res, next);
  }
}

/**
 * Handle product restoration (un-delete).
 * POST /api/products/:id/restore
 *
 * Requires authentication and MANAGER/ADMIN role.
 */
export async function restoreProduct(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id as string;
    const product = await productService.restoreProduct(id);
    success(res, product);
  } catch (error) {
    handleProductError(error, res, next);
  }
}

/**
 * Handle product creation.
 * POST /api/products
 *
 * Requires authentication and MANAGER/ADMIN role.
 */
export async function createProduct(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = {
      ...req.body,
      createdByUserId: req.user!.userId,
    };
    const product = await productService.createProduct(input);
    created(res, product);
  } catch (error) {
    handleProductError(error, res, next);
  }
}

/**
 * Handle product update.
 * PATCH /api/products/:id
 *
 * Requires authentication and MANAGER/ADMIN role.
 */
export async function updateProduct(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id as string;
    const { priceChangeReason, ...updateInput } = req.body;
    const changedByUserId = req.user!.userId;

    const product = await productService.updateProduct(
      id,
      updateInput,
      changedByUserId,
      priceChangeReason
    );
    success(res, product);
  } catch (error) {
    handleProductError(error, res, next);
  }
}

/**
 * Handle product listing with filters and pagination.
 * GET /api/products
 *
 * Public endpoint (optionalAuth for admin filters).
 */
export async function listProducts(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input: Record<string, unknown> = {};

    if (req.query.page) {
      input.page = parseInt(req.query.page as string, 10);
    }

    if (req.query.limit) {
      input.limit = parseInt(req.query.limit as string, 10);
    }

    if (req.query.search) {
      input.search = req.query.search as string;
    }

    if (req.query.productTypeId) {
      input.productTypeId = req.query.productTypeId as string;
    }

    if (req.query.isActive !== undefined) {
      input.isActive = req.query.isActive === 'true';
    }

    if (req.query.isHot !== undefined) {
      input.isHot = req.query.isHot === 'true';
    }

    if (req.query.minPrice) {
      input.minPrice = parseFloat(req.query.minPrice as string);
    }

    if (req.query.maxPrice) {
      input.maxPrice = parseFloat(req.query.maxPrice as string);
    }

    if (req.query.sortBy) {
      input.sortBy = req.query.sortBy as string;
    }

    if (req.query.sortDirection) {
      input.sortDirection = req.query.sortDirection as string;
    }

    // Only allow includeSoftDeleted for MANAGER/ADMIN roles
    if (req.query.includeSoftDeleted === 'true') {
      const userRole = req.user?.role;
      if (userRole === UserRole.MANAGER || userRole === UserRole.ADMIN) {
        input.includeSoftDeleted = true;
      }
    }

    const result = await productService.listProducts(input);

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    handleProductError(error, res, next);
  }
}

/**
 * Handle product retrieval by ID.
 * GET /api/products/:id
 *
 * Requires authentication and MANAGER/ADMIN role.
 * Includes soft-deleted products.
 */
export async function getProductById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id as string;
    const product = await productService.getProductById(id, true);
    success(res, product);
  } catch (error) {
    handleProductError(error, res, next);
  }
}

/**
 * Handle product activation.
 * POST /api/products/:id/activate
 *
 * Requires authentication and MANAGER/ADMIN role.
 */
export async function activateProduct(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id as string;
    const product = await productService.updateProduct(id, { isActive: true });
    success(res, product);
  } catch (error) {
    handleProductError(error, res, next);
  }
}

/**
 * Handle product deactivation.
 * POST /api/products/:id/deactivate
 *
 * Requires authentication and MANAGER/ADMIN role.
 */
export async function deactivateProduct(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id as string;
    const product = await productService.updateProduct(id, { isActive: false });
    success(res, product);
  } catch (error) {
    handleProductError(error, res, next);
  }
}

/**
 * Private helper to handle product domain errors.
 * Maps domain errors to HTTP status codes.
 */
function handleProductError(error: unknown, res: Response, next: NextFunction): void {
  if (error instanceof InvalidProductDataError) {
    res.status(400).json({
      success: false,
      error: {
        message: error.message,
        code: error.code,
        field: error.field,
      },
    });
    return;
  }

  if (error instanceof ProductNotFoundError) {
    res.status(404).json({
      success: false,
      error: {
        message: error.message,
        code: error.code,
      },
    });
    return;
  }

  if (error instanceof ProductSlugAlreadyExistsError) {
    res.status(409).json({
      success: false,
      error: {
        message: error.message,
        code: error.code,
      },
    });
    return;
  }

  next(error);
}
