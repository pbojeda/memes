import { ValidationError } from '../../domain/errors/AuthError';

export interface RegisterInput {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface ValidatedRegisterInput {
  email: string;
  password: string;
  firstName: string | undefined;
  lastName: string | undefined;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ValidatedLoginInput {
  email: string;
  password: string;
}

export interface RefreshInput {
  refreshToken: string;
  userId: string;
}

export interface ValidatedRefreshInput {
  refreshToken: string;
  userId: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ValidatedForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
}

export interface ValidatedResetPasswordInput {
  token: string;
  newPassword: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const REFRESH_TOKEN_MIN_LENGTH = 32;
const REFRESH_TOKEN_MAX_LENGTH = 256;
const RESET_TOKEN_MIN_LENGTH = 32;
const MIN_PASSWORD_LENGTH = 12;
const MAX_NAME_LENGTH = 100;

const PASSWORD_REQUIREMENTS = {
  minLength: MIN_PASSWORD_LENGTH,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
};

function validateEmail(email: string | undefined): string {
  if (!email || email.trim() === '') {
    throw new ValidationError('Email is required', 'email');
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!EMAIL_REGEX.test(normalizedEmail)) {
    throw new ValidationError('Invalid email format', 'email');
  }

  return normalizedEmail;
}

function validatePassword(password: string | undefined, enforceComplexity: boolean): string {
  if (!password || password === '') {
    throw new ValidationError('Password is required', 'password');
  }

  if (enforceComplexity) {
    if (password.length < PASSWORD_REQUIREMENTS.minLength) {
      throw new ValidationError(
        `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters`,
        'password'
      );
    }

    if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
      throw new ValidationError(
        'Password must contain at least one uppercase letter',
        'password'
      );
    }

    if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
      throw new ValidationError(
        'Password must contain at least one lowercase letter',
        'password'
      );
    }

    if (PASSWORD_REQUIREMENTS.requireNumber && !/[0-9]/.test(password)) {
      throw new ValidationError(
        'Password must contain at least one number',
        'password'
      );
    }
  }

  return password;
}

function validateName(name: string | undefined, fieldName: string): string | undefined {
  if (!name) {
    return undefined;
  }

  const trimmedName = name.trim();

  if (trimmedName.length > MAX_NAME_LENGTH) {
    throw new ValidationError(
      `${fieldName} must not exceed ${MAX_NAME_LENGTH} characters`,
      fieldName.toLowerCase().replace(' ', '')
    );
  }

  return trimmedName || undefined;
}

export function validateRegisterInput(input: RegisterInput): ValidatedRegisterInput {
  const email = validateEmail(input.email);
  const password = validatePassword(input.password, true);
  const firstName = validateName(input.firstName, 'First name');
  const lastName = validateName(input.lastName, 'Last name');

  return {
    email,
    password,
    firstName,
    lastName,
  };
}

export function validateLoginInput(input: LoginInput): ValidatedLoginInput {
  const email = validateEmail(input.email);
  const password = validatePassword(input.password, false);

  return {
    email,
    password,
  };
}

export function validateRefreshInput(input: RefreshInput): ValidatedRefreshInput {
  const { refreshToken, userId } = input;

  // Validate refreshToken
  if (!refreshToken || typeof refreshToken !== 'string') {
    throw new ValidationError('Refresh token is required', 'refreshToken');
  }

  if (refreshToken.length < REFRESH_TOKEN_MIN_LENGTH || refreshToken.length > REFRESH_TOKEN_MAX_LENGTH) {
    throw new ValidationError('Invalid refresh token format', 'refreshToken');
  }

  // Validate userId
  if (!userId || typeof userId !== 'string') {
    throw new ValidationError('User ID is required', 'userId');
  }

  if (!UUID_REGEX.test(userId)) {
    throw new ValidationError('Invalid user ID format', 'userId');
  }

  return {
    refreshToken,
    userId,
  };
}

export function validateForgotPasswordInput(input: ForgotPasswordInput): ValidatedForgotPasswordInput {
  const email = validateEmail(input.email);

  return { email };
}

function validateNewPassword(password: string | undefined): string {
  if (!password || password === '') {
    throw new ValidationError('Password is required', 'newPassword');
  }

  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    throw new ValidationError(
      `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters`,
      'newPassword'
    );
  }

  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    throw new ValidationError(
      'Password must contain at least one uppercase letter',
      'newPassword'
    );
  }

  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    throw new ValidationError(
      'Password must contain at least one lowercase letter',
      'newPassword'
    );
  }

  if (PASSWORD_REQUIREMENTS.requireNumber && !/[0-9]/.test(password)) {
    throw new ValidationError(
      'Password must contain at least one number',
      'newPassword'
    );
  }

  return password;
}

export function validateResetPasswordInput(input: ResetPasswordInput): ValidatedResetPasswordInput {
  const { token, newPassword } = input;

  // Validate token
  if (!token || typeof token !== 'string') {
    throw new ValidationError('Reset token is required', 'token');
  }

  if (token.length < RESET_TOKEN_MIN_LENGTH) {
    throw new ValidationError('Invalid reset token format', 'token');
  }

  // Validate newPassword with complexity rules
  const validatedPassword = validateNewPassword(newPassword);

  return {
    token,
    newPassword: validatedPassword,
  };
}
