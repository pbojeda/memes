import { Request, Response, NextFunction } from 'express';
import * as authService from '../../application/services/authService';
import * as tokenService from '../../application/services/tokenService';
import {
  validateRegisterInput,
  validateLoginInput,
  validateRefreshInput,
} from '../../application/validators/authValidator';
import {
  InvalidCredentialsError,
  EmailAlreadyExistsError,
  UserNotActiveError,
  UserNotFoundError,
  ValidationError,
  InvalidTokenError,
} from '../../domain/errors/AuthError';

/**
 * Handle user registration.
 * POST /api/auth/register
 */
export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validatedInput = validateRegisterInput(req.body);
    const user = await authService.register(validatedInput);

    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error) {
    if (error instanceof ValidationError) {
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

    if (error instanceof EmailAlreadyExistsError) {
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
}

/**
 * Handle user login.
 * POST /api/auth/login
 */
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validatedInput = validateLoginInput(req.body);
    const user = await authService.login(validatedInput);

    const accessToken = tokenService.generateAccessToken(user);
    const refreshToken = await tokenService.generateRefreshToken(user.id);

    res.status(200).json({
      success: true,
      data: {
        user,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    if (error instanceof ValidationError) {
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

    if (error instanceof InvalidCredentialsError) {
      res.status(401).json({
        success: false,
        error: {
          message: error.message,
          code: error.code,
        },
      });
      return;
    }

    if (error instanceof UserNotActiveError) {
      res.status(401).json({
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
}

/**
 * Handle user logout.
 * POST /api/auth/logout
 * Requires authentication (authMiddleware)
 */
export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Defensive check - should never happen with authMiddleware, but prevents runtime errors
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required',
          code: 'UNAUTHORIZED',
        },
      });
      return;
    }

    const userId = req.user.userId;
    await authService.logout(userId);

    res.status(200).json({
      success: true,
      data: {
        message: 'Logged out successfully',
      },
    });
  } catch (error) {
    if (error instanceof UserNotFoundError) {
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
}

/**
 * Handle token refresh.
 * POST /api/auth/refresh
 */
export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validatedInput = validateRefreshInput(req.body);
    const tokens = await tokenService.refreshTokens(validatedInput.refreshToken, validatedInput.userId);

    res.status(200).json({
      success: true,
      data: tokens,
    });
  } catch (error) {
    if (error instanceof ValidationError) {
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

    if (error instanceof InvalidTokenError) {
      res.status(401).json({
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
}
