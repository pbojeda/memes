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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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
