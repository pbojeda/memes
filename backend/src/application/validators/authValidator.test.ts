import { validateRegisterInput, validateLoginInput } from './authValidator';
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
});
