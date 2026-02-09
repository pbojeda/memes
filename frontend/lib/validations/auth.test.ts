import {
  PASSWORD_POLICY,
  validatePassword,
  validateEmail,
  validatePasswordMatch,
} from './auth';

describe('PASSWORD_POLICY', () => {
  it('should match backend requirements', () => {
    expect(PASSWORD_POLICY).toEqual({
      minLength: 12,
      requireUppercase: true,
      requireLowercase: true,
      requireNumber: true,
    });
  });
});

describe('validatePassword', () => {
  it('should return valid for a strong password', () => {
    const result = validatePassword('SecurePass123');
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should require minimum 12 characters', () => {
    const result = validatePassword('Short1Aa');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('At least 12 characters');
  });

  it('should require uppercase letter', () => {
    const result = validatePassword('lowercase1234');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('One uppercase letter');
  });

  it('should require lowercase letter', () => {
    const result = validatePassword('UPPERCASE1234');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('One lowercase letter');
  });

  it('should require a number', () => {
    const result = validatePassword('NoNumbersHere');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('One number');
  });

  it('should return multiple errors for weak password', () => {
    const result = validatePassword('weak');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('At least 12 characters');
    expect(result.errors).toContain('One uppercase letter');
    expect(result.errors).toContain('One number');
  });

  it('should handle empty password', () => {
    const result = validatePassword('');
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should return individual requirement status', () => {
    const result = validatePassword('Short1');
    expect(result.requirements.minLength).toBe(false);
    expect(result.requirements.hasUppercase).toBe(true);
    expect(result.requirements.hasLowercase).toBe(true);
    expect(result.requirements.hasNumber).toBe(true);
  });
});

describe('validateEmail', () => {
  it('should return valid for correct email format', () => {
    const result = validateEmail('user@example.com');
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should reject email without @', () => {
    const result = validateEmail('userexample.com');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Invalid email format');
  });

  it('should reject email without domain', () => {
    const result = validateEmail('user@');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Invalid email format');
  });

  it('should reject empty email', () => {
    const result = validateEmail('');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Email is required');
  });

  it('should trim whitespace', () => {
    const result = validateEmail('  user@example.com  ');
    expect(result.isValid).toBe(true);
  });
});

describe('validatePasswordMatch', () => {
  it('should return valid when passwords match', () => {
    const result = validatePasswordMatch('SecurePass123', 'SecurePass123');
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should return invalid when passwords do not match', () => {
    const result = validatePasswordMatch('SecurePass123', 'DifferentPass123');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Passwords do not match');
  });

  it('should return invalid for empty confirm password', () => {
    const result = validatePasswordMatch('SecurePass123', '');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Please confirm your password');
  });
});
