import { Request, Response, NextFunction } from 'express';
import * as productService from '../../application/services/productService';
import {
  InvalidProductDataError,
  ProductNotFoundError,
} from '../../domain/errors/ProductError';
import { success, noContent } from '../../utils/responseHelpers';

/**
 * Handle product detail retrieval by slug.
 * GET /api/products/:slug
 *
 * Public endpoint (no auth required).
 */
export async function getProductDetail(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const slug = req.params.slug as string;
    const product = await productService.getProductDetailBySlug(slug);
    success(res, product);
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

  next(error);
}
