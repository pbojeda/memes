import { Request, Response, NextFunction } from 'express';
import * as productTypeService from '../../application/services/productTypeService';
import { UNAUTHENTICATED_ROLE } from '../../application/validators/productTypeValidator';
import {
  InvalidProductTypeDataError,
  ProductTypeNotFoundError,
  ProductTypeSlugAlreadyExistsError,
} from '../../domain/errors/ProductTypeError';
import { success, created, noContent } from '../../utils/responseHelpers';

/**
 * Handle product type list retrieval.
 * GET /api/product-types
 *
 * Public endpoint (no auth required), but role-aware:
 * - Unauthenticated/TARGET users see only active product types
 * - ADMIN/MANAGER/MARKETING users can filter by isActive query param
 */
export async function listProductTypes(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const callerRole = req.user?.role ?? UNAUTHENTICATED_ROLE;

    let isActive: boolean | undefined = undefined;
    if (req.query.isActive !== undefined) {
      isActive = req.query.isActive === 'true';
    }

    const productTypes = await productTypeService.getAllProductTypes({
      callerRole,
      isActive,
    });

    success(res, productTypes);
  } catch (error) {
    next(error);
  }
}

/**
 * Handle product type creation.
 * POST /api/product-types
 * Requires authentication + ADMIN role (via middleware)
 */
export async function createProductType(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const productType = await productTypeService.createProductType(req.body);
    created(res, productType);
  } catch (error) {
    handleProductTypeError(error, res, next);
  }
}

/**
 * Handle product type update.
 * PATCH /api/product-types/:id
 * Requires authentication + ADMIN role (via middleware)
 */
export async function updateProductType(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id as string;
    const productType = await productTypeService.updateProductType(id, req.body);
    success(res, productType);
  } catch (error) {
    handleProductTypeError(error, res, next);
  }
}

/**
 * Handle product type deletion.
 * DELETE /api/product-types/:id
 * Requires authentication + ADMIN role (via middleware)
 */
export async function deleteProductType(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id as string;
    await productTypeService.deleteProductType(id);
    noContent(res);
  } catch (error) {
    handleProductTypeError(error, res, next);
  }
}

/**
 * Private helper to handle product type domain errors.
 * Maps domain errors to HTTP status codes.
 */
function handleProductTypeError(error: unknown, res: Response, next: NextFunction): void {
  if (error instanceof InvalidProductTypeDataError) {
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

  if (error instanceof ProductTypeNotFoundError) {
    res.status(404).json({
      success: false,
      error: {
        message: error.message,
        code: error.code,
      },
    });
    return;
  }

  if (error instanceof ProductTypeSlugAlreadyExistsError) {
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
