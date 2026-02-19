import { Request, Response, NextFunction } from 'express';
import * as orderTotalService from '../../application/services/orderTotalService';
import { InvalidOrderTotalDataError } from '../../domain/errors/OrderTotalError';
import { success } from '../../utils/responseHelpers';

/**
 * Handle order total calculation.
 * POST /api/cart/calculate
 * Public endpoint — no authentication required.
 */
export async function calculateOrderTotal(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await orderTotalService.calculateOrderTotal(req.body);
    success(res, result);
  } catch (error) {
    handleOrderTotalError(error, res, next);
  }
}

/**
 * Private helper to handle order total domain errors.
 * Maps InvalidOrderTotalDataError to 400; passes other errors to next().
 */
function handleOrderTotalError(error: unknown, res: Response, next: NextFunction): void {
  if (error instanceof InvalidOrderTotalDataError) {
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
