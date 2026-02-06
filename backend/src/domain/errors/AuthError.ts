/**
 * Base class for authentication-related errors.
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Thrown when login credentials are invalid.
 * Used for both "email not found" and "wrong password" to prevent user enumeration.
 */
export class InvalidCredentialsError extends AuthError {
  constructor() {
    super('Invalid email or password', 'INVALID_CREDENTIALS');
    this.name = 'InvalidCredentialsError';
  }
}

/**
 * Thrown when attempting to register with an email that already exists.
 */
export class EmailAlreadyExistsError extends AuthError {
  constructor() {
    super('Email already registered', 'EMAIL_ALREADY_EXISTS');
    this.name = 'EmailAlreadyExistsError';
  }
}

/**
 * Thrown when attempting to authenticate an inactive or deleted user.
 */
export class UserNotActiveError extends AuthError {
  constructor() {
    super('User account is not active', 'USER_NOT_ACTIVE');
    this.name = 'UserNotActiveError';
  }
}

/**
 * Thrown when a user is not found (for operations that require an existing user).
 */
export class UserNotFoundError extends AuthError {
  constructor() {
    super('User not found', 'USER_NOT_FOUND');
    this.name = 'UserNotFoundError';
  }
}

/**
 * Thrown when input validation fails.
 */
export class ValidationError extends AuthError {
  constructor(
    message: string,
    public readonly field?: string
  ) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}
