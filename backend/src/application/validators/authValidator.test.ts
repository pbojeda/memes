import {
  validateRegisterInput,
  validateLoginInput,
  validateRefreshInput,
  validateForgotPasswordInput,
  validateResetPasswordInput,
} from './authValidator';
import { ValidationError } from '../../domain/errors/AuthError';

describe('authValidator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateRegisterInput', () => {
    describe('valid inputs', () => {
      it('should return validated data when all required fields are provided', () => {
        const input = {
          email: 'test@example.com',
          password: 'Password123!',
        };

        const result = validateRegisterInput(input);

        expect(result).toEqual({
          email: 'test@example.com',
          password: 'Password123!',
          firstName: undefined,
          lastName: undefined,
        });
      });

      it('should return validated data with optional fields', () => {
        const input = {
          email: 'test@example.com',
          password: 'Password123!',
          firstName: 'John',
          lastName: 'Doe',
        };

        const result = validateRegisterInput(input);

        expect(result).toEqual({
          email: 'test@example.com',
          password: 'Password123!',
          firstName: 'John',
          lastName: 'Doe',
        });
      });

      it('should normalize email to lowercase', () => {
        const input = {
          email: 'TEST@EXAMPLE.COM',
          password: 'Password123!',
        };

        const result = validateRegisterInput(input);

        expect(result.email).toBe('test@example.com');
      });

      it('should trim whitespace from email', () => {
        const input = {
          email: '  test@example.com  ',
          password: 'Password123!',
        };

        const result = validateRegisterInput(input);

        expect(result.email).toBe('test@example.com');
      });

      it('should trim whitespace from names', () => {
        const input = {
          email: 'test@example.com',
          password: 'Password123!',
          firstName: '  John  ',
          lastName: '  Doe  ',
        };

        const result = validateRegisterInput(input);

        expect(result.firstName).toBe('John');
        expect(result.lastName).toBe('Doe');
      });
    });

    describe('email validation', () => {
      it('should throw ValidationError when email is missing', () => {
        const input = {
          password: 'Password123!',
        };

        expect(() => validateRegisterInput(input as never)).toThrow(ValidationError);
        expect(() => validateRegisterInput(input as never)).toThrow('Email is required');
      });

      it('should throw ValidationError when email is empty', () => {
        const input = {
          email: '',
          password: 'Password123!',
        };

        expect(() => validateRegisterInput(input)).toThrow(ValidationError);
        expect(() => validateRegisterInput(input)).toThrow('Email is required');
      });

      it('should throw ValidationError when email format is invalid', () => {
        const input = {
          email: 'invalid-email',
          password: 'Password123!',
        };

        expect(() => validateRegisterInput(input)).toThrow(ValidationError);
        expect(() => validateRegisterInput(input)).toThrow('Invalid email format');
      });

      it('should throw ValidationError when email is missing @', () => {
        const input = {
          email: 'testexample.com',
          password: 'Password123!',
        };

        expect(() => validateRegisterInput(input)).toThrow(ValidationError);
        expect(() => validateRegisterInput(input)).toThrow('Invalid email format');
      });
    });

    describe('password validation', () => {
      it('should throw ValidationError when password is missing', () => {
        const input = {
          email: 'test@example.com',
        };

        expect(() => validateRegisterInput(input as never)).toThrow(ValidationError);
        expect(() => validateRegisterInput(input as never)).toThrow('Password is required');
      });

      it('should throw ValidationError when password is empty', () => {
        const input = {
          email: 'test@example.com',
          password: '',
        };

        expect(() => validateRegisterInput(input)).toThrow(ValidationError);
        expect(() => validateRegisterInput(input)).toThrow('Password is required');
      });

      it('should throw ValidationError when password is too short', () => {
        const input = {
          email: 'test@example.com',
          password: 'Short1pass',
        };

        expect(() => validateRegisterInput(input)).toThrow(ValidationError);
        expect(() => validateRegisterInput(input)).toThrow('Password must be at least 12 characters');
      });

      it('should throw ValidationError when password has no uppercase', () => {
        const input = {
          email: 'test@example.com',
          password: 'alllowercase123',
        };

        expect(() => validateRegisterInput(input)).toThrow(ValidationError);
        expect(() => validateRegisterInput(input)).toThrow('Password must contain at least one uppercase letter');
      });

      it('should throw ValidationError when password has no lowercase', () => {
        const input = {
          email: 'test@example.com',
          password: 'ALLUPPERCASE123',
        };

        expect(() => validateRegisterInput(input)).toThrow(ValidationError);
        expect(() => validateRegisterInput(input)).toThrow('Password must contain at least one lowercase letter');
      });

      it('should throw ValidationError when password has no number', () => {
        const input = {
          email: 'test@example.com',
          password: 'NoNumbersHere',
        };

        expect(() => validateRegisterInput(input)).toThrow(ValidationError);
        expect(() => validateRegisterInput(input)).toThrow('Password must contain at least one number');
      });

      it('should accept password meeting all requirements', () => {
        const input = {
          email: 'test@example.com',
          password: 'ValidPass123!',
        };

        const result = validateRegisterInput(input);

        expect(result.password).toBe('ValidPass123!');
      });
    });

    describe('name validation', () => {
      it('should throw ValidationError when firstName exceeds 100 characters', () => {
        const input = {
          email: 'test@example.com',
          password: 'Password123!',
          firstName: 'a'.repeat(101),
        };

        expect(() => validateRegisterInput(input)).toThrow(ValidationError);
        expect(() => validateRegisterInput(input)).toThrow('First name must not exceed 100 characters');
      });

      it('should throw ValidationError when lastName exceeds 100 characters', () => {
        const input = {
          email: 'test@example.com',
          password: 'Password123!',
          lastName: 'a'.repeat(101),
        };

        expect(() => validateRegisterInput(input)).toThrow(ValidationError);
        expect(() => validateRegisterInput(input)).toThrow('Last name must not exceed 100 characters');
      });

      it('should accept names with exactly 100 characters', () => {
        const input = {
          email: 'test@example.com',
          password: 'Password123!',
          firstName: 'a'.repeat(100),
          lastName: 'b'.repeat(100),
        };

        const result = validateRegisterInput(input);

        expect(result.firstName).toHaveLength(100);
        expect(result.lastName).toHaveLength(100);
      });
    });
  });

  describe('validateLoginInput', () => {
    describe('valid inputs', () => {
      it('should return validated data when all fields are provided', () => {
        const input = {
          email: 'test@example.com',
          password: 'Password123!',
        };

        const result = validateLoginInput(input);

        expect(result).toEqual({
          email: 'test@example.com',
          password: 'Password123!',
        });
      });

      it('should normalize email to lowercase', () => {
        const input = {
          email: 'TEST@EXAMPLE.COM',
          password: 'Password123!',
        };

        const result = validateLoginInput(input);

        expect(result.email).toBe('test@example.com');
      });

      it('should trim whitespace from email', () => {
        const input = {
          email: '  test@example.com  ',
          password: 'Password123!',
        };

        const result = validateLoginInput(input);

        expect(result.email).toBe('test@example.com');
      });
    });

    describe('email validation', () => {
      it('should throw ValidationError when email is missing', () => {
        const input = {
          password: 'Password123!',
        };

        expect(() => validateLoginInput(input as never)).toThrow(ValidationError);
        expect(() => validateLoginInput(input as never)).toThrow('Email is required');
      });

      it('should throw ValidationError when email format is invalid', () => {
        const input = {
          email: 'invalid-email',
          password: 'Password123!',
        };

        expect(() => validateLoginInput(input)).toThrow(ValidationError);
        expect(() => validateLoginInput(input)).toThrow('Invalid email format');
      });
    });

    describe('password validation', () => {
      it('should throw ValidationError when password is missing', () => {
        const input = {
          email: 'test@example.com',
        };

        expect(() => validateLoginInput(input as never)).toThrow(ValidationError);
        expect(() => validateLoginInput(input as never)).toThrow('Password is required');
      });

      it('should throw ValidationError when password is empty', () => {
        const input = {
          email: 'test@example.com',
          password: '',
        };

        expect(() => validateLoginInput(input)).toThrow(ValidationError);
        expect(() => validateLoginInput(input)).toThrow('Password is required');
      });

      it('should accept any password length for login', () => {
        const input = {
          email: 'test@example.com',
          password: 'a',
        };

        const result = validateLoginInput(input);

        expect(result.password).toBe('a');
      });
    });
  });

  describe('validateRefreshInput', () => {
    const validRefreshToken = 'a'.repeat(64); // 64 hex chars (32 bytes)
    const validUserId = '123e4567-e89b-12d3-a456-426614174000';

    describe('valid inputs', () => {
      it('should return validated data when all fields are valid', () => {
        const input = {
          refreshToken: validRefreshToken,
          userId: validUserId,
        };

        const result = validateRefreshInput(input);

        expect(result).toEqual({
          refreshToken: validRefreshToken,
          userId: validUserId,
        });
      });

      it('should accept refresh token at minimum length (32)', () => {
        const input = {
          refreshToken: 'a'.repeat(32),
          userId: validUserId,
        };

        const result = validateRefreshInput(input);

        expect(result.refreshToken).toHaveLength(32);
      });

      it('should accept refresh token at maximum length (256)', () => {
        const input = {
          refreshToken: 'a'.repeat(256),
          userId: validUserId,
        };

        const result = validateRefreshInput(input);

        expect(result.refreshToken).toHaveLength(256);
      });

      it('should accept valid UUID in lowercase', () => {
        const input = {
          refreshToken: validRefreshToken,
          userId: '123e4567-e89b-12d3-a456-426614174000',
        };

        const result = validateRefreshInput(input);

        expect(result.userId).toBe('123e4567-e89b-12d3-a456-426614174000');
      });

      it('should accept valid UUID in uppercase', () => {
        const input = {
          refreshToken: validRefreshToken,
          userId: '123E4567-E89B-12D3-A456-426614174000',
        };

        const result = validateRefreshInput(input);

        expect(result.userId).toBe('123E4567-E89B-12D3-A456-426614174000');
      });
    });

    describe('refreshToken validation', () => {
      it('should throw ValidationError when refreshToken is missing', () => {
        const input = {
          userId: validUserId,
        };

        expect(() => validateRefreshInput(input as never)).toThrow(ValidationError);
        expect(() => validateRefreshInput(input as never)).toThrow('Refresh token is required');
      });

      it('should throw ValidationError when refreshToken is null', () => {
        const input = {
          refreshToken: null,
          userId: validUserId,
        };

        expect(() => validateRefreshInput(input as never)).toThrow(ValidationError);
        expect(() => validateRefreshInput(input as never)).toThrow('Refresh token is required');
      });

      it('should throw ValidationError when refreshToken is not a string', () => {
        const input = {
          refreshToken: 12345,
          userId: validUserId,
        };

        expect(() => validateRefreshInput(input as never)).toThrow(ValidationError);
        expect(() => validateRefreshInput(input as never)).toThrow('Refresh token is required');
      });

      it('should throw ValidationError when refreshToken is too short', () => {
        const input = {
          refreshToken: 'a'.repeat(31),
          userId: validUserId,
        };

        expect(() => validateRefreshInput(input)).toThrow(ValidationError);
        expect(() => validateRefreshInput(input)).toThrow('Invalid refresh token format');
      });

      it('should throw ValidationError when refreshToken is too long', () => {
        const input = {
          refreshToken: 'a'.repeat(257),
          userId: validUserId,
        };

        expect(() => validateRefreshInput(input)).toThrow(ValidationError);
        expect(() => validateRefreshInput(input)).toThrow('Invalid refresh token format');
      });
    });

    describe('userId validation', () => {
      it('should throw ValidationError when userId is missing', () => {
        const input = {
          refreshToken: validRefreshToken,
        };

        expect(() => validateRefreshInput(input as never)).toThrow(ValidationError);
        expect(() => validateRefreshInput(input as never)).toThrow('User ID is required');
      });

      it('should throw ValidationError when userId is null', () => {
        const input = {
          refreshToken: validRefreshToken,
          userId: null,
        };

        expect(() => validateRefreshInput(input as never)).toThrow(ValidationError);
        expect(() => validateRefreshInput(input as never)).toThrow('User ID is required');
      });

      it('should throw ValidationError when userId is not a string', () => {
        const input = {
          refreshToken: validRefreshToken,
          userId: 12345,
        };

        expect(() => validateRefreshInput(input as never)).toThrow(ValidationError);
        expect(() => validateRefreshInput(input as never)).toThrow('User ID is required');
      });

      it('should throw ValidationError when userId is not a valid UUID', () => {
        const input = {
          refreshToken: validRefreshToken,
          userId: 'not-a-valid-uuid',
        };

        expect(() => validateRefreshInput(input)).toThrow(ValidationError);
        expect(() => validateRefreshInput(input)).toThrow('Invalid user ID format');
      });

      it('should throw ValidationError when userId is empty', () => {
        const input = {
          refreshToken: validRefreshToken,
          userId: '',
        };

        expect(() => validateRefreshInput(input)).toThrow(ValidationError);
        expect(() => validateRefreshInput(input)).toThrow('User ID is required');
      });

      it('should throw ValidationError when UUID has wrong format', () => {
        const input = {
          refreshToken: validRefreshToken,
          userId: '123e4567e89b12d3a456426614174000', // Missing hyphens
        };

        expect(() => validateRefreshInput(input)).toThrow(ValidationError);
        expect(() => validateRefreshInput(input)).toThrow('Invalid user ID format');
      });
    });

    describe('ValidationError properties', () => {
      it('should include field property for refreshToken errors', () => {
        const input = {
          refreshToken: '',
          userId: validUserId,
        };

        try {
          validateRefreshInput(input as never);
          fail('Expected ValidationError to be thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          expect((error as ValidationError).field).toBe('refreshToken');
        }
      });

      it('should include field property for userId errors', () => {
        const input = {
          refreshToken: validRefreshToken,
          userId: 'invalid',
        };

        try {
          validateRefreshInput(input);
          fail('Expected ValidationError to be thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          expect((error as ValidationError).field).toBe('userId');
        }
      });
    });
  });

  describe('validateForgotPasswordInput', () => {
    describe('valid inputs', () => {
      it('should return validated email when valid', () => {
        const input = { email: 'test@example.com' };

        const result = validateForgotPasswordInput(input);

        expect(result).toEqual({ email: 'test@example.com' });
      });

      it('should normalize email to lowercase', () => {
        const input = { email: 'TEST@EXAMPLE.COM' };

        const result = validateForgotPasswordInput(input);

        expect(result.email).toBe('test@example.com');
      });

      it('should trim whitespace from email', () => {
        const input = { email: '  test@example.com  ' };

        const result = validateForgotPasswordInput(input);

        expect(result.email).toBe('test@example.com');
      });
    });

    describe('email validation', () => {
      it('should throw ValidationError when email is missing', () => {
        const input = {};

        expect(() => validateForgotPasswordInput(input as never)).toThrow(ValidationError);
        expect(() => validateForgotPasswordInput(input as never)).toThrow('Email is required');
      });

      it('should throw ValidationError when email is empty', () => {
        const input = { email: '' };

        expect(() => validateForgotPasswordInput(input)).toThrow(ValidationError);
        expect(() => validateForgotPasswordInput(input)).toThrow('Email is required');
      });

      it('should throw ValidationError when email format is invalid', () => {
        const input = { email: 'invalid-email' };

        expect(() => validateForgotPasswordInput(input)).toThrow(ValidationError);
        expect(() => validateForgotPasswordInput(input)).toThrow('Invalid email format');
      });
    });
  });

  describe('validateResetPasswordInput', () => {
    const validToken = 'a'.repeat(64);

    describe('valid inputs', () => {
      it('should return validated data when all fields are valid', () => {
        const input = {
          token: validToken,
          newPassword: 'NewPassword123!',
        };

        const result = validateResetPasswordInput(input);

        expect(result).toEqual({
          token: validToken,
          newPassword: 'NewPassword123!',
        });
      });

      it('should accept token at minimum length (32)', () => {
        const input = {
          token: 'a'.repeat(32),
          newPassword: 'NewPassword123!',
        };

        const result = validateResetPasswordInput(input);

        expect(result.token).toHaveLength(32);
      });
    });

    describe('token validation', () => {
      it('should throw ValidationError when token is missing', () => {
        const input = { newPassword: 'NewPassword123!' };

        expect(() => validateResetPasswordInput(input as never)).toThrow(ValidationError);
        expect(() => validateResetPasswordInput(input as never)).toThrow('Reset token is required');
      });

      it('should throw ValidationError when token is empty', () => {
        const input = { token: '', newPassword: 'NewPassword123!' };

        expect(() => validateResetPasswordInput(input)).toThrow(ValidationError);
        expect(() => validateResetPasswordInput(input)).toThrow('Reset token is required');
      });

      it('should throw ValidationError when token is too short', () => {
        const input = {
          token: 'a'.repeat(31),
          newPassword: 'NewPassword123!',
        };

        expect(() => validateResetPasswordInput(input)).toThrow(ValidationError);
        expect(() => validateResetPasswordInput(input)).toThrow('Invalid reset token format');
      });

      it('should throw ValidationError when token is not a string', () => {
        const input = {
          token: 12345,
          newPassword: 'NewPassword123!',
        };

        expect(() => validateResetPasswordInput(input as never)).toThrow(ValidationError);
        expect(() => validateResetPasswordInput(input as never)).toThrow('Reset token is required');
      });
    });

    describe('newPassword validation', () => {
      it('should throw ValidationError when newPassword is missing', () => {
        const input = { token: validToken };

        expect(() => validateResetPasswordInput(input as never)).toThrow(ValidationError);
        expect(() => validateResetPasswordInput(input as never)).toThrow('Password is required');
      });

      it('should throw ValidationError when newPassword is too short', () => {
        const input = {
          token: validToken,
          newPassword: 'Short1pass',
        };

        expect(() => validateResetPasswordInput(input)).toThrow(ValidationError);
        expect(() => validateResetPasswordInput(input)).toThrow('Password must be at least 12 characters');
      });

      it('should throw ValidationError when newPassword has no uppercase', () => {
        const input = {
          token: validToken,
          newPassword: 'alllowercase123',
        };

        expect(() => validateResetPasswordInput(input)).toThrow(ValidationError);
        expect(() => validateResetPasswordInput(input)).toThrow('Password must contain at least one uppercase letter');
      });

      it('should throw ValidationError when newPassword has no lowercase', () => {
        const input = {
          token: validToken,
          newPassword: 'ALLUPPERCASE123',
        };

        expect(() => validateResetPasswordInput(input)).toThrow(ValidationError);
        expect(() => validateResetPasswordInput(input)).toThrow('Password must contain at least one lowercase letter');
      });

      it('should throw ValidationError when newPassword has no number', () => {
        const input = {
          token: validToken,
          newPassword: 'NoNumbersHereAbc',
        };

        expect(() => validateResetPasswordInput(input)).toThrow(ValidationError);
        expect(() => validateResetPasswordInput(input)).toThrow('Password must contain at least one number');
      });
    });

    describe('ValidationError properties', () => {
      it('should include field property for token errors', () => {
        const input = { token: '', newPassword: 'NewPassword123!' };

        try {
          validateResetPasswordInput(input);
          fail('Expected ValidationError to be thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          expect((error as ValidationError).field).toBe('token');
        }
      });

      it('should include field property for newPassword errors', () => {
        const input = { token: validToken, newPassword: 'weak' };

        try {
          validateResetPasswordInput(input);
          fail('Expected ValidationError to be thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          expect((error as ValidationError).field).toBe('newPassword');
        }
      });
    });
  });
});
