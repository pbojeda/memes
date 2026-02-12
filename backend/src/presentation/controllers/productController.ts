import { Request, Response, NextFunction } from 'express';
import * as productService from '../../application/services/productService';
import {
  InvalidProductDataError,
  ProductNotFoundError,
} from '../../domain/errors/ProductError';
import { success } from '../../utils/responseHelpers';

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
