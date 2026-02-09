import { Request, Response, NextFunction } from 'express';
import logger from '../lib/logger';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed') {
    super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403);
  }
}

interface ErrorResponse {
  error: {
    message: string;
    statusCode: number;
    stack?: string;
  };
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  const isProduction = process.env.NODE_ENV === 'production';
  const isOperational = err instanceof AppError;

  // Log the error
  if (isOperational) {
    logger.warn({ err, statusCode: err.statusCode }, err.message);
  } else {
    logger.error({ err }, 'Unexpected error occurred');
  }

  // Determine status code and message
  const statusCode = isOperational ? err.statusCode : 500;
  const message = isOperational ? err.message : 'Internal Server Error';

  // Build response
  const response: ErrorResponse = {
    error: {
      message,
      statusCode,
    },
  };

  // Include stack trace in development
  if (!isProduction) {
    response.error.stack = err.stack;
  }

  res.status(statusCode).json(response);
}
