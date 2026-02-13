import { Request, Response, NextFunction } from 'express';
import * as productImageService from '../../application/services/productImageService';
import {
  InvalidProductImageDataError,
  ProductImageNotFoundError,
} from '../../domain/errors/ProductImageError';
import { ProductNotFoundError } from '../../domain/errors/ProductError';
import { success, created, noContent } from '../../utils/responseHelpers';

/**
 * Handle listing product images.
 * GET /api/products/:productId/images
 *
 * Public endpoint (no auth required).
 */
export async function listImages(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const productId = req.params.productId as string;
    const images = await productImageService.listProductImages(productId);
    success(res, images);
  } catch (error) {
    handleProductImageError(error, res, next);
  }
}

/**
 * Handle adding a product image.
 * POST /api/products/:productId/images
 *
 * Requires authentication and MANAGER/ADMIN role.
 */
export async function addImage(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const productId = req.params.productId as string;
    const image = await productImageService.addProductImage(productId, req.body);
    created(res, image);
  } catch (error) {
    handleProductImageError(error, res, next);
  }
}

/**
 * Handle updating a product image.
 * PATCH /api/products/:productId/images/:imageId
 *
 * Requires authentication and MANAGER/ADMIN role.
 */
export async function updateImage(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const productId = req.params.productId as string;
    const imageId = req.params.imageId as string;
    const image = await productImageService.updateProductImage(productId, imageId, req.body);
    success(res, image);
  } catch (error) {
    handleProductImageError(error, res, next);
  }
}

/**
 * Handle deleting a product image.
 * DELETE /api/products/:productId/images/:imageId
 *
 * Requires authentication and MANAGER/ADMIN role.
 */
export async function deleteImage(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const productId = req.params.productId as string;
    const imageId = req.params.imageId as string;
    await productImageService.deleteProductImage(productId, imageId);
    noContent(res);
  } catch (error) {
    handleProductImageError(error, res, next);
  }
}

/**
 * Private helper to handle product image domain errors.
 * Maps domain errors to HTTP status codes.
 */
function handleProductImageError(error: unknown, res: Response, next: NextFunction): void {
  if (error instanceof InvalidProductImageDataError) {
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

  if (error instanceof ProductImageNotFoundError || error instanceof ProductNotFoundError) {
    res.status(404).json({
      success: false,
      error: {
        message: error.message,
        code: error.code,
      },
    });
    return;
  }

  // Unknown error - pass to global error handler
  next(error);
}
