import { Request, Response, NextFunction } from 'express';
import * as promoCodeService from '../../application/services/promoCodeService';
import { InvalidPromoCodeDataError } from '../../domain/errors/PromoCodeError';
import { success } from '../../utils/responseHelpers';

/**
 * Handle promo code validation.
 * POST /api/promo-codes/validate
 * Public endpoint — no authentication required.
 */
export async function validatePromoCode(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await promoCodeService.validatePromoCode(req.body);
    success(res, result);
  } catch (error) {
    handlePromoCodeError(error, res, next);
  }
}

/**
 * Private helper to handle promo code domain errors.
 * Maps InvalidPromoCodeDataError to 400; passes other errors to next().
 */
function handlePromoCodeError(error: unknown, res: Response, next: NextFunction): void {
  if (error instanceof InvalidPromoCodeDataError) {
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
