/**
 * Password policy matching backend requirements.
 * See: backend/src/application/validators/authValidator.ts
 */
export const PASSWORD_POLICY = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
} as const;

export interface PasswordRequirements {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
}

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  requirements: PasswordRequirements;
}

export interface EmailValidationResult {
  isValid: boolean;
  error?: string;
}

export interface PasswordMatchResult {
  isValid: boolean;
  error?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates password against the password policy.
 * Returns detailed information about which requirements are met.
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  const requirements: PasswordRequirements = {
    minLength: password.length >= PASSWORD_POLICY.minLength,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
  };

  if (!requirements.minLength) {
    errors.push('At least 12 characters');
  }
  if (!requirements.hasUppercase) {
    errors.push('One uppercase letter');
  }
  if (!requirements.hasLowercase) {
    errors.push('One lowercase letter');
  }
  if (!requirements.hasNumber) {
    errors.push('One number');
  }

  return {
    isValid: errors.length === 0,
    errors,
    requirements,
  };
}

/**
 * Validates email format.
 */
export function validateEmail(email: string): EmailValidationResult {
  const trimmed = email.trim();

  if (!trimmed) {
    return { isValid: false, error: 'Email is required' };
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    return { isValid: false, error: 'Invalid email format' };
  }

  return { isValid: true };
}

/**
 * Validates that password and confirmation match.
 */
export function validatePasswordMatch(
  password: string,
  confirmPassword: string
): PasswordMatchResult {
  if (!confirmPassword) {
    return { isValid: false, error: 'Please confirm your password' };
  }

  if (password !== confirmPassword) {
    return { isValid: false, error: 'Passwords do not match' };
  }

  return { isValid: true };
}
