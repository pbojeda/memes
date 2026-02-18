import { Request, Response, NextFunction } from 'express';
import * as addressService from '../../application/services/addressService';
import {
  InvalidAddressDataError,
  AddressNotFoundError,
  AddressLimitExceededError,
  DefaultAddressCannotBeDeletedError,
} from '../../domain/errors/AddressError';
import { success, created, noContent } from '../../utils/responseHelpers';

/**
 * Handle address list retrieval.
 * GET /api/users/me/addresses
 * Requires authentication.
 */
export async function listAddresses(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const addresses = await addressService.listAddresses(userId);
    success(res, addresses);
  } catch (error) {
    next(error);
  }
}

/**
 * Handle address creation.
 * POST /api/users/me/addresses
 * Requires authentication.
 */
export async function createAddress(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const address = await addressService.createAddress(userId, req.body);
    created(res, address);
  } catch (error) {
    handleAddressError(error, res, next);
  }
}

/**
 * Handle address retrieval by ID.
 * GET /api/users/me/addresses/:addressId
 * Requires authentication.
 */
export async function getAddressById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const addressId = req.params.addressId as string;
    const address = await addressService.getAddressById(userId, addressId);
    success(res, address);
  } catch (error) {
    handleAddressError(error, res, next);
  }
}

/**
 * Handle address update.
 * PATCH /api/users/me/addresses/:addressId
 * Requires authentication.
 */
export async function updateAddress(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const addressId = req.params.addressId as string;
    const address = await addressService.updateAddress(userId, addressId, req.body);
    success(res, address);
  } catch (error) {
    handleAddressError(error, res, next);
  }
}

/**
 * Handle address deletion.
 * DELETE /api/users/me/addresses/:addressId
 * Requires authentication.
 */
export async function deleteAddress(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const addressId = req.params.addressId as string;
    await addressService.deleteAddress(userId, addressId);
    noContent(res);
  } catch (error) {
    handleAddressError(error, res, next);
  }
}

/**
 * Private helper to handle address domain errors.
 * Maps domain errors to HTTP status codes.
 */
function handleAddressError(error: unknown, res: Response, next: NextFunction): void {
  if (error instanceof InvalidAddressDataError) {
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

  if (error instanceof AddressNotFoundError) {
    res.status(404).json({
      success: false,
      error: {
        message: error.message,
        code: error.code,
      },
    });
    return;
  }

  if (error instanceof AddressLimitExceededError) {
    res.status(409).json({
      success: false,
      error: {
        message: error.message,
        code: error.code,
      },
    });
    return;
  }

  if (error instanceof DefaultAddressCannotBeDeletedError) {
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
