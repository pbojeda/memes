import { Request, Response, NextFunction } from 'express';
import * as authService from '../../application/services/authService';
import * as tokenService from '../../application/services/tokenService';
import {
  validateRegisterInput,
  validateLoginInput,
  validateRefreshInput,
  validateForgotPasswordInput,
  validateResetPasswordInput,
} from '../../application/validators/authValidator';
import {
  InvalidCredentialsError,
  EmailAlreadyExistsError,
  UserNotActiveError,
  UserNotFoundError,
  ValidationError,
  InvalidTokenError,
  PasswordResetTokenInvalidError,
  PasswordResetTokenExpiredError,
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
    handleAuthError(error, res, next);
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
    handleAuthError(error, res, next);
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
    handleAuthError(error, res, next);
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
    handleAuthError(error, res, next);
  }
}

/**
 * Handle forgot password request.
 * POST /api/auth/forgot-password
 */
export async function forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validatedInput = validateForgotPasswordInput(req.body);

    // Request password reset - returns token for logging/email, null if user doesn't exist
    // We always return success to prevent user enumeration
    await authService.requestPasswordReset(validatedInput.email);

    res.status(200).json({
      success: true,
      data: {
        message: 'If an account with that email exists, a password reset link has been sent.',
      },
    });
  } catch (error) {
    handleAuthError(error, res, next);
  }
}

/**
 * Handle password reset.
 * POST /api/auth/reset-password
 */
export async function resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validatedInput = validateResetPasswordInput(req.body);
    await authService.resetPassword(validatedInput.token, validatedInput.newPassword);

    res.status(200).json({
      success: true,
      data: {
        message: 'Password has been reset successfully.',
      },
    });
  } catch (error) {
    handleAuthError(error, res, next);
  }
}

/**
 * Private helper to handle auth domain errors.
 * Maps domain errors to HTTP status codes.
 */
function handleAuthError(error: unknown, res: Response, next: NextFunction): void {
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

  if (error instanceof InvalidCredentialsError || error instanceof UserNotActiveError) {
    res.status(401).json({
      success: false,
      error: {
        message: error.message,
        code: error.code,
      },
    });
    return;
  }

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

  if (error instanceof PasswordResetTokenInvalidError || error instanceof PasswordResetTokenExpiredError) {
    res.status(400).json({
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
