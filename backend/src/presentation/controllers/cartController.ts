import { Request, Response, NextFunction } from 'express';
import * as cartService from '../../application/services/cartService';
import { InvalidCartDataError } from '../../domain/errors/CartError';
import { success } from '../../utils/responseHelpers';

/**
 * Handle cart validation.
 * POST /api/cart/validate
 * Public endpoint — no authentication required.
 */
export async function validateCart(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await cartService.validateCart(req.body);
    success(res, result);
  } catch (error) {
    handleCartError(error, res, next);
  }
}

/**
 * Private helper to handle cart domain errors.
 * Maps InvalidCartDataError to 400; passes other errors to next().
 */
function handleCartError(error: unknown, res: Response, next: NextFunction): void {
  if (error instanceof InvalidCartDataError) {
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

  next(error);
}
